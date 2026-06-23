"""Tiny pub/sub helper for streaming live job progress.

The worker publishes (sync); the API's WebSocket endpoint subscribes (async).
Progress is best-effort — a pub/sub failure must never fail a job.
"""
import json

import redis as redis_sync

from .config import get_settings

settings = get_settings()
_client: redis_sync.Redis | None = None


def _conn() -> redis_sync.Redis:
    global _client
    if _client is None:
        _client = redis_sync.from_url(settings.redis_url)
    return _client


def channel(job_id) -> str:
    return f"job:{job_id}:events"


def publish_event(job_id, payload: dict) -> None:
    try:
        _conn().publish(channel(job_id), json.dumps(payload))
    except Exception:  # noqa: BLE001 - progress streaming is best-effort
        pass
