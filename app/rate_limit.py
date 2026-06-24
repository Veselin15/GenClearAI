"""Simple sliding-window rate limiter backed by an in-process dict.

Sufficient for a single-worker deployment. For multi-process, swap to
Redis INCR+EXPIRE.
"""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request

_lock = Lock()
_windows: dict[str, list[float]] = defaultdict(list)


def _clean(key: str, window_sec: float) -> list[float]:
    cutoff = time.monotonic() - window_sec
    _windows[key] = [t for t in _windows[key] if t > cutoff]
    return _windows[key]


def check_rate_limit(key: str, limit: int, window_sec: float = 60) -> None:
    with _lock:
        hits = _clean(key, window_sec)
        if len(hits) >= limit:
            raise HTTPException(429, "too many requests — please slow down")
        hits.append(time.monotonic())


def rate_limit_ip(request: Request, action: str, limit: int, window_sec: float = 60) -> None:
    ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"{action}:{ip}", limit, window_sec)
