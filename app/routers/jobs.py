import asyncio
import contextlib
import hashlib
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import redis.asyncio as redis_async
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from .. import storage, webhooks
from ..auth import COOKIE_NAME, current_user, user_id_from_token
from ..config import get_settings
from ..db import AsyncSessionLocal, get_db
from ..models import TERMINAL_STATUSES, Job, JobStatus, Plan, User
from ..queue_util import estimate_wait_sec, job_priority, jobs_ahead
from ..rate_limit import check_rate_limit
from ..redis_bus import channel
from ..schemas import JobCreateResponse, JobOut
from ..security import (
    hash_api_key,
    is_safe_webhook_url,
    make_download_token,
    verify_download_token,
)
from ..tasks import process_job
from ..validation import ValidationError, validate_video

settings = get_settings()
router = APIRouter(prefix="/v1")

_CHUNK = 1024 * 1024
_TERMINAL_VALUES = {s.value for s in TERMINAL_STATUSES}


def sanitize_filename(name: str) -> str:
    name = os.path.basename(name or "")
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name[:200] or "video.mp4"


async def _user_by_key(db: AsyncSession, key: str | None) -> User | None:
    if not key:
        return None
    res = await db.execute(select(User).where(User.api_key_hash == hash_api_key(key)))
    return res.scalar_one_or_none()


async def _ws_user(db: AsyncSession, websocket: WebSocket) -> User | None:
    """Authenticate a WebSocket via session cookie (browser) or ?key= (API)."""
    uid = user_id_from_token(websocket.cookies.get(COOKIE_NAME))
    if uid:
        try:
            user = await db.get(User, uuid.UUID(uid))
        except ValueError:
            user = None
        if user:
            return user
    return await _user_by_key(db, websocket.query_params.get("key"))


async def _get_owned(db: AsyncSession, job_id: uuid.UUID, user: User) -> Job:
    job = await db.get(Job, job_id)
    if job is None or job.user_id != user.id:
        raise HTTPException(404, "job not found")
    return job


async def _queue_position(db: AsyncSession, job: Job) -> int:
    ahead = await jobs_ahead(db, job)
    return ahead + 1


async def _enrich_job(db: AsyncSession, job: Job, out: JobOut) -> JobOut:
    if job.status == JobStatus.pending:
        out.queue_position = await _queue_position(db, job)
        out.eta_sec = await estimate_wait_sec(db, job)
    return out


def _with_links(out: JobOut, job: Job) -> JobOut:
    if job.status == JobStatus.finished:
        out.download_url = f"/v1/jobs/{job.id}/download?token={make_download_token(job.id)}"
    out.has_preview = bool(job.thumb_after)
    if job.width and job.height and job.output_width and job.output_height:
        out.quality_matched = (
            job.output_width >= job.width and job.output_height >= job.height
        )
    elif job.status == JobStatus.finished and job.width:
        out.quality_matched = True
    return out


def _stream_object(key: str, media_type: str, filename: str | None = None):
    body = storage.open_read_stream(key)
    headers: dict[str, str] = {"X-Content-Type-Options": "nosniff"}
    if filename:
        safe_name = filename.replace('"', "'")
        headers["Content-Disposition"] = f'attachment; filename="{safe_name}"'
    if media_type.startswith("image/"):
        headers["Cache-Control"] = "private, max-age=3600"
    return StreamingResponse(body, media_type=media_type, headers=headers)


@router.post("/jobs", status_code=201, response_model=JobCreateResponse)
async def create_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    webhook_url: str | None = Form(None),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Per-user upload throttle (independent of the pending-jobs back-pressure below).
    check_rate_limit(f"upload:{user.id}", settings.upload_rate_limit)

    if webhook_url and not is_safe_webhook_url(webhook_url):
        raise HTTPException(400, "webhook_url must be a public https endpoint")

    job_id = uuid.uuid4()
    scratch = storage.scratch_input(job_id)

    # Stream to scratch disk for validation, hashing, and durable upload.
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
        webhook_url=webhook_url,
    )

    # ---- Cache hit: identical bytes were processed before → instant result ----
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
            id=job_id, user_id=user.id, status=JobStatus.finished, progress=100,
            from_cache=True,
            output_path=restored.get("result.mp4"),
            thumb_before=restored.get("thumb_before.jpg"),
            thumb_after=restored.get("thumb_after.jpg"),
            watermark_type=prior.watermark_type if prior else None,
            output_width=prior.output_width if prior else meta["width"],
            output_height=prior.output_height if prior else meta["height"],
            finished_at=now,
            expires_at=now + timedelta(hours=settings.result_ttl_hours),
            **common,
        )
        db.add(job)
        user.videos_processed += 1
        await db.commit()
        # Cache hits finish synchronously and never reach the worker's Redis
        # event stream, so notify any webhook here (after the response is sent).
        if webhook_url:
            await db.refresh(job)
            background_tasks.add_task(webhooks.deliver, job)
        return JobCreateResponse(
            job_id=job_id, status=JobStatus.finished,
            status_url=f"/v1/jobs/{job_id}", events_url=f"/v1/jobs/{job_id}/events",
        )

    # ---- Normal path: back-pressure + credits, then queue ----
    pending = await db.scalar(
        select(func.count())
        .select_from(Job)
        .where(
            Job.user_id == user.id,
            Job.status.in_([JobStatus.pending, JobStatus.processing]),
        )
    )
    if pending >= settings.max_pending_jobs_per_user:
        storage.remove_input(job_id)
        raise HTTPException(429, "too many jobs in progress; try again later")

    if user.plan == Plan.free.value and user.credits <= 0:
        storage.remove_input(job_id)
        raise HTTPException(402, "no credits remaining — upgrade to keep processing")

    job = Job(
        id=job_id, user_id=user.id, status=JobStatus.pending,
        input_path=input_key, priority=job_priority(user), **common,
    )
    db.add(job)
    if user.plan == Plan.free.value:
        user.credits -= 1
    await db.commit()
    await db.refresh(job)

    prio = settings.pro_queue_priority if user.plan == Plan.pro.value else 1
    process_job.apply_async(args=[str(job_id)], priority=prio)

    eta = await estimate_wait_sec(db, job)
    return JobCreateResponse(
        job_id=job_id,
        status=JobStatus.pending,
        status_url=f"/v1/jobs/{job_id}",
        events_url=f"/v1/jobs/{job_id}/events",
        eta_sec=eta,
    )


@router.get("/jobs", response_model=list[JobOut])
async def list_jobs(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    res = await db.execute(
        select(Job)
        .where(Job.user_id == user.id)
        .order_by(Job.created_at.desc())
        .limit(min(limit, 100))
        .offset(offset)
    )
    jobs_out = []
    for j in res.scalars():
        out = _with_links(JobOut.model_validate(j), j)
        jobs_out.append(await _enrich_job(db, j, out))
    return jobs_out


@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(
    job_id: uuid.UUID,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned(db, job_id, user)
    out = _with_links(JobOut.model_validate(job), job)
    return await _enrich_job(db, job, out)


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(
    job_id: uuid.UUID,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned(db, job_id, user)
    if job.status == JobStatus.processing:
        raise HTTPException(409, "job is processing; cannot cancel mid-run")
    storage.remove_job_files(job.id)
    if job.status == JobStatus.pending:
        job.status = JobStatus.canceled
        job.input_path = None
        job.output_path = None
        await db.commit()
    else:
        await db.delete(job)
        await db.commit()


@router.get("/jobs/{job_id}/thumb/{which}")
async def thumbnail(
    job_id: uuid.UUID,
    which: Literal["before", "after"],
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned(db, job_id, user)
    key = job.thumb_before if which == "before" else job.thumb_after
    if not key or not storage.object_exists(key):
        raise HTTPException(404, "no preview available")
    return _stream_object(key, "image/jpeg")


@router.get("/jobs/{job_id}/download")
async def download(job_id: uuid.UUID, token: str, db: AsyncSession = Depends(get_db)):
    if verify_download_token(token) != str(job_id):
        raise HTTPException(403, "invalid or expired token")
    job = await db.get(Job, job_id)
    if job is None or job.status != JobStatus.finished or not job.output_path:
        raise HTTPException(404, "result not available")
    if not storage.object_exists(job.output_path):
        raise HTTPException(410, "result expired")
    download_name = job.original_name.rsplit(".", 1)[0] + "_processed.mp4"
    return _stream_object(job.output_path, "video/mp4", download_name)


@router.websocket("/jobs/{job_id}/events")
async def job_events(websocket: WebSocket, job_id: uuid.UUID):
    """Live progress stream. Auth via session cookie (browser) or ?key= (API)."""
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        user = await _ws_user(db, websocket)
        job = await db.get(Job, job_id)
        if user is None or job is None or job.user_id != user.id:
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
