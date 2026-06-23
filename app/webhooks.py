"""Webhook delivery, run from the API (which has egress) rather than the
network-isolated worker. A background listener subscribes to the workers'
Redis completion events and POSTs a signed notification to the job's callback.
"""
import contextlib
import json
import uuid

import httpx
import redis.asyncio as redis_async
from celery.utils.log import get_task_logger

from .config import get_settings
from .db import AsyncSessionLocal
from .models import Job, JobStatus
from .security import is_safe_webhook_url, make_download_token, webhook_signature

settings = get_settings()
log = get_task_logger(__name__)

# We notify on completion outcomes only — not on expired/canceled transitions.
_NOTIFY_VALUES = {JobStatus.finished.value, JobStatus.skipped.value, JobStatus.failed.value}


async def deliver(job: Job) -> None:
    if not job.webhook_url or not is_safe_webhook_url(job.webhook_url):
        return
    payload = {"job_id": str(job.id), "status": job.status.value}
    if job.status == JobStatus.finished:
        token = make_download_token(job.id)
        payload["download_url"] = (
            f"{settings.api_base_url}/v1/jobs/{job.id}/download?token={token}"
        )
    body = json.dumps(payload).encode()
    headers = {
        "Content-Type": "application/json",
        "X-GenClear-Signature": webhook_signature(body),
    }
    async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
        try:
            await client.post(job.webhook_url, content=body, headers=headers)
        except httpx.HTTPError as e:
            log.warning("webhook delivery failed for job %s: %s", job.id, e)


async def listen() -> None:
    """Long-running background task: deliver webhooks for completed jobs."""
    client = redis_async.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.psubscribe("job:*:events")
    try:
        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue
            try:
                data = json.loads(message["data"])
            except (ValueError, TypeError):
                continue
            if data.get("status") not in _NOTIFY_VALUES:
                continue
            chan = message["channel"]
            if isinstance(chan, bytes):
                chan = chan.decode()
            job_id = chan.split(":")[1]
            async with AsyncSessionLocal() as db:
                job = await db.get(Job, uuid.UUID(job_id))
                if job and job.webhook_url:
                    await deliver(job)
    finally:
        with contextlib.suppress(Exception):
            await pubsub.aclose()
            await client.aclose()
