"""Anonymous guest tier — one free clean without registration (PLG funnel)."""
import contextlib
import hashlib
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import redis.asyncio as redis_async
from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from .. import storage
from ..auth import GUEST_COOKIE_NAME, guest_id_from_token, issue_guest_session
from ..config import get_settings
from ..db import AsyncSessionLocal, get_db
from ..models import TERMINAL_STATUSES, Job, JobStatus
from ..queue_util import estimate_wait_sec
from ..rate_limit import rate_limit_ip
from ..redis_bus import channel
from ..routers.jobs import (
    _CHUNK,
    _enrich_job,
    _stream_object,
    _with_links,
    sanitize_filename,
)
from ..schemas import GuestJobOut, JobCreateResponse, JobOut
from ..tasks import process_job
from ..validation import ValidationError, validate_video

settings = get_settings()
router = APIRouter(prefix="/v1/guest")
_TERMINAL_VALUES = {s.value for s in TERMINAL_STATUSES}


def _guest_id(cookie: str | None) -> str:
    existing = guest_id_from_token(cookie)
    return existing or secrets.token_urlsafe(24)


async def _guest_job_count(db: AsyncSession, guest_id: str) -> int:
    return await db.scalar(
        select(func.count())
        .select_from(Job)
        .where(
            Job.guest_session_id == guest_id,
            Job.status.notin_([JobStatus.canceled, JobStatus.failed, JobStatus.expired]),
        )
    ) or 0


async def _get_guest_job(
    db: AsyncSession, job_id: uuid.UUID, guest_id: str
) -> Job:
    job = await db.get(Job, job_id)
    if job is None or job.guest_session_id != guest_id:
        raise HTTPException(404, "job not found")
    return job


@router.post("/jobs", status_code=201, response_model=JobCreateResponse)
async def create_guest_job(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
    genclear_guest: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Anonymous upload — one free clean per guest session, no account required."""
    rate_limit_ip(request, "guest_upload", settings.guest_rate_limit, window_sec=3600)

    guest_id = _guest_id(genclear_guest)
    issue_guest_session(response, guest_id)

    used = await _guest_job_count(db, guest_id)
    if used >= settings.guest_jobs_limit:
        raise HTTPException(
            402,
            "free trial used — create a free account for 3 monthly credits",
        )

    pending = await db.scalar(
        select(func.count())
        .select_from(Job)
        .where(
            Job.guest_session_id == guest_id,
            Job.status.in_([JobStatus.pending, JobStatus.processing]),
        )
    )
    if pending:
        raise HTTPException(429, "a job is already in progress")

    job_id = uuid.uuid4()
    scratch = storage.scratch_input(job_id)

    hasher = hashlib.sha256()
    size = 0
    try:
        with scratch.open("wb") as f:
            while chunk := await file.read(_CHUNK):
                size += len(chunk)
                if size > settings.max_upload_bytes:
                    raise HTTPException(413, "file too large")
                hasher.update(chunk)
                f.write(chunk)
    except HTTPException:
        storage.remove_input(job_id)
        raise

    if size == 0:
        storage.remove_input(job_id)
        raise HTTPException(400, "empty upload")

    try:
        meta = await run_in_threadpool(validate_video, scratch)
    except ValidationError as e:
        storage.remove_input(job_id)
        raise HTTPException(400, str(e))

    sha = hasher.hexdigest()
    input_key = storage.input_key(job_id)
    await run_in_threadpool(storage.write_file, input_key, scratch)

    common = dict(
        original_name=sanitize_filename(file.filename),
        mime_type=meta["mime_type"],
        size_bytes=size,
        sha256=sha,
        duration_sec=meta["duration_sec"],
        width=meta["width"],
        height=meta["height"],
    )

    if storage.cached_result(sha):
        storage.remove_input(job_id)
        restored = storage.restore_from_cache(sha, job_id)
        prior = await db.scalar(
            select(Job)
            .where(Job.sha256 == sha, Job.status == JobStatus.finished)
            .order_by(Job.finished_at.desc())
            .limit(1)
        )
        now = datetime.now(timezone.utc)
        job = Job(
            id=job_id,
            guest_session_id=guest_id,
            status=JobStatus.finished,
            progress=100,
            from_cache=True,
            output_path=restored.get("result.mp4"),
            thumb_before=restored.get("thumb_before.jpg"),
            thumb_after=restored.get("thumb_after.jpg"),
            watermark_type=prior.watermark_type if prior else None,
            output_width=prior.output_width if prior else meta["width"],
            output_height=prior.output_height if prior else meta["height"],
            finished_at=now,
            expires_at=now + timedelta(hours=settings.guest_result_ttl_hours),
            **common,
        )
        db.add(job)
        await db.commit()
        return JobCreateResponse(
            job_id=job_id,
            status=JobStatus.finished,
            status_url=f"/v1/guest/jobs/{job_id}",
            events_url=f"/v1/guest/jobs/{job_id}/events",
        )

    job = Job(
        id=job_id,
        guest_session_id=guest_id,
        status=JobStatus.pending,
        input_path=input_key,
        priority=0,
        **common,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    process_job.apply_async(args=[str(job_id)], priority=0)

    eta = await estimate_wait_sec(db, job)
    return JobCreateResponse(
        job_id=job_id,
        status=JobStatus.pending,
        status_url=f"/v1/guest/jobs/{job_id}",
        events_url=f"/v1/guest/jobs/{job_id}/events",
        eta_sec=eta,
    )


@router.get("/jobs/{job_id}", response_model=GuestJobOut)
async def get_guest_job(
    job_id: uuid.UUID,
    genclear_guest: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    guest_id = guest_id_from_token(genclear_guest)
    if not guest_id:
        raise HTTPException(401, "guest session required")
    job = await _get_guest_job(db, job_id, guest_id)
    base = _with_links(JobOut.model_validate(job), job, guest=True)
    enriched = await _enrich_job(db, job, base)
    data = enriched.model_dump()
    data["requires_registration"] = (
        await _guest_job_count(db, guest_id) >= settings.guest_jobs_limit
    )
    return GuestJobOut(**data)


@router.get("/jobs/{job_id}/thumb/{which}")
async def guest_thumbnail(
    job_id: uuid.UUID,
    which: str,
    genclear_guest: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    guest_id = guest_id_from_token(genclear_guest)
    if not guest_id:
        raise HTTPException(401, "guest session required")
    job = await _get_guest_job(db, job_id, guest_id)
    key = job.thumb_before if which == "before" else job.thumb_after
    if not key or not storage.object_exists(key):
        raise HTTPException(404, "no preview available")
    return _stream_object(key, "image/jpeg")


@router.get("/jobs/{job_id}/download")
async def guest_download(
    job_id: uuid.UUID,
    token: str,
    genclear_guest: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    from ..security import verify_download_token

    if verify_download_token(token) != str(job_id):
        raise HTTPException(403, "invalid or expired token")
    guest_id = guest_id_from_token(genclear_guest)
    if not guest_id:
        raise HTTPException(401, "guest session required")
    job = await _get_guest_job(db, job_id, guest_id)
    if job.status != JobStatus.finished or not job.output_path:
        raise HTTPException(404, "result not available")
    if not storage.object_exists(job.output_path):
        raise HTTPException(410, "result expired")
    download_name = job.original_name.rsplit(".", 1)[0] + "_processed.mp4"
    return _stream_object(job.output_path, "video/mp4", download_name)


@router.websocket("/jobs/{job_id}/events")
async def guest_job_events(websocket: WebSocket, job_id: uuid.UUID):
    await websocket.accept()
    guest_id = guest_id_from_token(websocket.cookies.get(GUEST_COOKIE_NAME))
    if not guest_id:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        job = await db.get(Job, job_id)
        if job is None or job.guest_session_id != guest_id:
            await websocket.close(code=4401)
            return
        await websocket.send_json({
            "status": job.status.value,
            "progress": job.progress,
            "has_preview": bool(job.thumb_after),
        })
        if job.status in TERMINAL_STATUSES:
            await websocket.close()
            return

    client = redis_async.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.subscribe(channel(job_id))
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                data = json.loads(message["data"])
            except (ValueError, TypeError):
                continue
            if not isinstance(data, dict):
                continue
            await websocket.send_json(data)
            if data.get("status") in _TERMINAL_VALUES:
                break
    except WebSocketDisconnect:
        pass
    finally:
        with contextlib.suppress(Exception):
            await pubsub.unsubscribe(channel(job_id))
            await pubsub.aclose()
            await client.aclose()
        with contextlib.suppress(Exception):
            await websocket.close()
