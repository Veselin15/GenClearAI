"""Celery tasks: run the Veo binary on one clip, and sweep expired results."""
import logging
import os
import re
import signal
import subprocess
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

from celery.exceptions import SoftTimeLimitExceeded
from sqlalchemy import select, update

from . import storage
from .celery_app import celery
from .config import get_settings
from .db import SyncSessionLocal
from .db_migrate import run_sync_migrations
from .models import Job, JobEvent, JobStatus, Plan, User
from .redis_bus import publish_event
from .validation import video_dimensions

settings = get_settings()
_log = logging.getLogger(__name__)


def _refund_credit(session, job: Job) -> None:
    if not job.user_id:
        return
    # Atomic increment so a refund can't race the API's credit spend or a
    # concurrent grant. Scoped to free users — pro plans don't consume credits.
    session.execute(
        update(User)
        .where(User.id == job.user_id, User.plan == Plan.free.value)
        .values(credits=User.credits + 1)
    )
    session.commit()

_PERCENT = re.compile(rb"(\d{1,3}(?:\.\d+)?)\s*%")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _record(session, job: Job, status: JobStatus, **fields) -> None:
    job.status = status
    for k, v in fields.items():
        setattr(job, k, v)
    session.add(JobEvent(job_id=job.id, status=status, note=fields.get("error_message")))
    session.commit()
    publish_event(
        job.id,
        {
            "status": status.value,
            "progress": job.progress,
            "error": job.error_message,
            "has_preview": bool(job.thumb_after),
        },
    )


def _kill(proc: subprocess.Popen) -> None:
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError, OSError):
        proc.kill()


def _thumb(src, dst, at_sec: float, width: int | None = None) -> bool:
    w = width or settings.thumb_width
    w = min(max(w, 480), settings.thumb_max_width)
    cmd = [
        "ffmpeg", "-y", "-ss", f"{max(at_sec, 0):.2f}", "-i", str(src),
        "-frames:v", "1", "-vf", f"scale={w}:-2:flags=lanczos",
        "-q:v", "2", str(dst),
    ]
    try:
        subprocess.run(cmd, capture_output=True, timeout=20, check=True)
        return dst.exists() and dst.stat().st_size > 0
    except Exception:  # noqa: BLE001
        return False


def _thumbs_parallel(in_path, out_path, out_dir: Path, mid: float, source_width: int | None) -> dict[str, Path]:
    thumb_w = source_width or settings.thumb_width
    thumb_w = min(max(thumb_w, settings.thumb_width), settings.thumb_max_width)
    tb, ta = out_dir / "thumb_before.jpg", out_dir / "thumb_after.jpg"
    paths: dict[str, Path] = {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {
            pool.submit(_thumb, in_path, tb, mid, thumb_w): "thumb_before.jpg",
            pool.submit(_thumb, out_path, ta, mid, thumb_w): "thumb_after.jpg",
        }
        for fut in as_completed(futures):
            name = futures[fut]
            if fut.result():
                paths[name] = out_dir / name
    return paths


def _detect_watermark(text: str) -> str | None:
    low = text.lower()
    if "diamond" in low:
        return "diamond"
    if "veo" in low and "text" in low:
        return "veo-text"
    if "legacy" in low:
        return "legacy"
    return None


def _run_tool(input_path, output_path, on_progress):
    cmd = [settings.tool_bin, "-i", str(input_path), "-o", str(output_path)]
    extra = settings.tool_extra_args.split()
    if extra:
        cmd[1:1] = extra

    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True
    )

    captured = bytearray()
    state = {"skipped": False}

    def reader():
        last = -1
        buf = b""
        while True:
            chunk = proc.stdout.read(256)
            if not chunk:
                break
            captured.extend(chunk)
            buf += chunk
            if b"SKIP" in buf.upper():
                state["skipped"] = True
            match = None
            for match in _PERCENT.finditer(buf):
                pass
            if match:
                pct = int(float(match.group(1)))
                if 0 <= pct <= 100 and pct != last:
                    last = pct
                    on_progress(pct)
            buf = buf[-64:]

    thread = threading.Thread(target=reader, daemon=True)
    thread.start()
    try:
        proc.wait(timeout=settings.job_timeout_sec)
    except (subprocess.TimeoutExpired, SoftTimeLimitExceeded):
        _kill(proc)
        raise
    thread.join(timeout=5)
    tail = bytes(captured[-4000:]).decode("utf-8", "replace")
    return proc.returncode, tail, state["skipped"]


def _ensure_full_resolution(in_path: Path, out_path: Path) -> dict[str, int] | None:
    """If the tool shrinks frames, re-encode at source resolution — identical for Free and Pro."""
    target = video_dimensions(in_path)
    current = video_dimensions(out_path)
    if not target or not current:
        return current or target

    if not settings.ensure_output_resolution:
        return current

    tw, th = target["width"], target["height"]
    cw, ch = current["width"], current["height"]
    if cw >= tw and ch >= th:
        return current

    fixed = out_path.with_suffix(".fixed.mp4")
    vf = f"scale={tw}:{th}:flags=lanczos"
    cmd = [
        "ffmpeg", "-y", "-i", str(out_path),
        "-vf", vf,
        "-c:v", "libx264", "-crf", str(settings.output_crf),
        "-preset", "slow", "-pix_fmt", "yuv420p",
        "-c:a", "copy", str(fixed),
    ]
    try:
        subprocess.run(cmd, capture_output=True, timeout=600, check=True)
        if fixed.exists() and fixed.stat().st_size > 0:
            fixed.replace(out_path)
            return {"width": tw, "height": th}
    except Exception:  # noqa: BLE001
        if fixed.exists():
            fixed.unlink(missing_ok=True)
    return current


def _finish_success(session, job: Job, in_path, out_path, out_dir, code, watermark) -> None:
    """Upload result + previews, then mark finished in one commit."""
    out_dims = _ensure_full_resolution(in_path, out_path)
    if out_dims:
        job.output_width = out_dims["width"]
        job.output_height = out_dims["height"]
    elif job.width and job.height:
        job.output_width = job.width
        job.output_height = job.height

    storage.write_file(storage.output_key(job.id, "result.mp4"), out_path)
    job.output_path = storage.output_key(job.id, "result.mp4")
    job.finished_at = _now()
    if job.started_at:
        job.processing_sec = round((job.finished_at - job.started_at).total_seconds(), 2)
    user = session.get(User, job.user_id) if job.user_id else None
    if job.guest_session_id:
        ttl_hours = settings.guest_result_ttl_hours
    elif user and user.plan == Plan.pro.value:
        ttl_hours = settings.pro_result_ttl_hours
    else:
        ttl_hours = settings.result_ttl_hours
    job.expires_at = job.finished_at + timedelta(hours=ttl_hours)

    mid = float(job.duration_sec or 2) / 2
    thumb_paths = _thumbs_parallel(in_path, out_path, out_dir, mid, job.width)
    for name, path in thumb_paths.items():
        key = storage.output_key(job.id, name)
        storage.write_file(key, path)
        if name == "thumb_before.jpg":
            job.thumb_before = key
        else:
            job.thumb_after = key

    _record(
        session, job, JobStatus.finished, progress=100,
        exit_code=code, watermark_type=watermark,
    )
    if user:
        user.videos_processed += 1
        session.commit()

    storage.save_to_cache(job.sha256, out_dir)
    storage.remove_input(job.id)


@celery.task(bind=True, name="app.tasks.process_job")
def process_job(self, job_id: str) -> None:
    run_sync_migrations()
    jid = uuid.UUID(job_id)
    with SyncSessionLocal() as session:
        job = session.get(Job, jid)
        if job is None or job.status != JobStatus.pending:
            return

        in_path = storage.prepare_worker_input(job.id, job.input_path)
        out_dir = storage.ensure_dir(storage.scratch_output_dir(job.id))
        out_path = out_dir / "result.mp4"

        job.attempts += 1
        job.started_at = _now()
        _record(session, job, JobStatus.processing, progress=0)

        persisted = {"p": -5}

        def on_progress(pct: int) -> None:
            publish_event(job.id, {"status": "processing", "progress": pct})
            if pct - persisted["p"] >= 5:
                persisted["p"] = pct
                with SyncSessionLocal() as s:
                    s.execute(update(Job).where(Job.id == jid).values(progress=pct))
                    s.commit()

        try:
            code, tail, skipped = _run_tool(in_path, out_path, on_progress)
        except subprocess.TimeoutExpired:
            _record(
                session, job, JobStatus.failed,
                error_message=f"processing exceeded {settings.job_timeout_sec}s",
            )
            storage.remove_input(job.id)
            _refund_credit(session, job)
            return
        except SoftTimeLimitExceeded:
            _record(session, job, JobStatus.failed, error_message="time limit exceeded")
            storage.remove_input(job.id)
            _refund_credit(session, job)
            return

        watermark = _detect_watermark(tail)
        produced = out_path.exists() and out_path.stat().st_size > 0

        if skipped and not produced:
            _record(
                session, job, JobStatus.skipped, exit_code=code,
                watermark_type=watermark,
                error_message="no supported watermark detected",
            )
            _refund_credit(session, job)
        elif code == 0 and produced:
            _finish_success(session, job, in_path, out_path, out_dir, code, watermark)
        else:
            _record(
                session, job, JobStatus.failed, exit_code=code,
                error_message=f"tool exited with code {code}: {tail[-500:]}",
            )
            _refund_credit(session, job)

        if job.status != JobStatus.finished:
            storage.remove_input(job.id)


@celery.task(name="app.tasks.reset_monthly_credits")
def reset_monthly_credits() -> int:
    from .credits import reset_all_monthly_credits

    run_sync_migrations()
    with SyncSessionLocal() as session:
        count = reset_all_monthly_credits(session)
    if count:
        _log.info("reset_monthly_credits: refreshed %d free account(s)", count)
    return count


@celery.task(name="app.tasks.cleanup_expired")
def cleanup_expired() -> int:
    run_sync_migrations()
    now = _now()
    with SyncSessionLocal() as session:
        rows = session.scalars(
            select(Job).where(
                Job.status == JobStatus.finished, Job.expires_at < now
            )
        ).all()
        for job in rows:
            storage.remove_job_files(job.id)
            job.status = JobStatus.expired
            job.output_path = None
            job.thumb_before = None
            job.thumb_after = None
        session.commit()
    purged = storage.purge_stale_cache(settings.cache_ttl_hours * 3600)
    if rows or purged:
        _log.info("cleanup_expired: expired %d result(s), purged %d cache entr(y/ies)", len(rows), purged)
    return len(rows)


@celery.task(name="app.tasks.reap_stuck_jobs")
def reap_stuck_jobs() -> int:
    """Recover jobs orphaned by a worker crash.

    With ``task_acks_late`` a dead worker redelivers its task, but the job row is
    already ``processing`` so ``process_job`` early-returns and the job would hang
    forever. Anything still ``processing`` well past the hard timeout can only be
    orphaned (the worker kills the binary at ``job_timeout_sec``), so fail it,
    free the input, and refund the credit.
    """
    run_sync_migrations()
    cutoff = _now() - timedelta(seconds=settings.job_timeout_sec + settings.stuck_job_grace_sec)
    with SyncSessionLocal() as session:
        rows = session.scalars(
            select(Job).where(
                Job.status == JobStatus.processing,
                Job.started_at.is_not(None),
                Job.started_at < cutoff,
            )
        ).all()
        for job in rows:
            _record(
                session, job, JobStatus.failed,
                error_message="worker did not finish in time; job reaped and credit refunded",
            )
            storage.remove_input(job.id)
            _refund_credit(session, job)
        if rows:
            _log.warning("reap_stuck_jobs: reaped %d orphaned job(s)", len(rows))
    return len(rows)
