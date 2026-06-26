"""Object storage for job inputs, outputs, and the content-addressed cache.

Supports two backends:
  - ``s3``   — MinIO or any S3-compatible store (production default)
  - ``local`` — filesystem under DATA_DIR (useful for local dev without MinIO)

The worker always processes files on local scratch disk; this module handles
upload/download to the durable backend.
"""
from __future__ import annotations

import contextlib
import shutil
import time
from functools import lru_cache
from pathlib import Path
from typing import BinaryIO, Iterator

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import get_settings

settings = get_settings()
DATA_DIR = Path(settings.data_dir)
SCRATCH_DIR = DATA_DIR / "scratch"

_CACHE_FILES = ("result.mp4", "thumb_before.jpg", "thumb_after.jpg")


# ---------------------------------------------------------------------------
# Key / path helpers (stored in the DB as relative paths)
# ---------------------------------------------------------------------------

def input_key(job_id) -> str:
    return f"in/{job_id}/source.mp4"


def output_prefix(job_id) -> str:
    return f"out/{job_id}"


def output_key(job_id, name: str) -> str:
    return f"{output_prefix(job_id)}/{name}"


def cache_prefix(sha256: str) -> str:
    return f"cache/{sha256}"


def cache_key(sha256: str, name: str) -> str:
    return f"{cache_prefix(sha256)}/{name}"


def scratch_dir(job_id) -> Path:
    return SCRATCH_DIR / str(job_id)


def ensure_scratch(job_id) -> Path:
    p = scratch_dir(job_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def scratch_input(job_id) -> Path:
    return ensure_scratch(job_id) / "source.mp4"


def scratch_output_dir(job_id) -> Path:
    return ensure_scratch(job_id) / "out"


# Legacy aliases used by older call sites ------------------------------------

def input_dir(job_id) -> Path:
    return DATA_DIR / "in" / str(job_id)


def output_dir(job_id) -> Path:
    return DATA_DIR / "out" / str(job_id)


def ensure_dir(p: Path) -> Path:
    p.mkdir(parents=True, exist_ok=True)
    return p


def abs_path(rel: str) -> Path:
    return DATA_DIR / rel


def rel_path(p: Path) -> str:
    return str(p.relative_to(DATA_DIR))


# ---------------------------------------------------------------------------
# S3 client
# ---------------------------------------------------------------------------

@lru_cache
def _s3():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4"),
    )


def ensure_bucket() -> None:
    if settings.storage_backend != "s3":
        ensure_dir(DATA_DIR / "in")
        ensure_dir(DATA_DIR / "out")
        ensure_dir(DATA_DIR / "cache")
        ensure_dir(SCRATCH_DIR)
        return
    s3 = _s3()
    try:
        s3.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        s3.create_bucket(Bucket=settings.s3_bucket)
    ensure_dir(SCRATCH_DIR)


def _s3_exists(key: str) -> bool:
    try:
        _s3().head_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except ClientError:
        return False


def _s3_size(key: str) -> int:
    return _s3().head_object(Bucket=settings.s3_bucket, Key=key)["ContentLength"]


def _local_exists(rel: str) -> bool:
    p = DATA_DIR / rel
    return p.exists() and p.stat().st_size > 0


# ---------------------------------------------------------------------------
# Read / write
# ---------------------------------------------------------------------------

def object_exists(key: str) -> bool:
    if settings.storage_backend == "local":
        return _local_exists(key)
    return _s3_exists(key)


def write_stream(key: str, chunks: Iterator[bytes]) -> int:
    """Stream bytes to storage. Returns total size written."""
    if settings.storage_backend == "local":
        dest = ensure_dir((DATA_DIR / key).parent) / Path(key).name
        size = 0
        with dest.open("wb") as f:
            for chunk in chunks:
                size += len(chunk)
                f.write(chunk)
        return size

    s3 = _s3()
    parts: list[bytes] = []
    size = 0
    for chunk in chunks:
        parts.append(chunk)
        size += len(chunk)
    body = b"".join(parts)
    s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=body)
    return size


def write_file(key: str, src: Path) -> None:
    if settings.storage_backend == "local":
        dest = ensure_dir((DATA_DIR / key).parent) / Path(key).name
        shutil.copy2(src, dest)
        return
    _s3().upload_file(str(src), settings.s3_bucket, key)


def download_to_path(key: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if settings.storage_backend == "local":
        shutil.copy2(DATA_DIR / key, dest)
        return
    _s3().download_file(settings.s3_bucket, key, str(dest))


def open_read_stream(key: str) -> BinaryIO:
    if settings.storage_backend == "local":
        return (DATA_DIR / key).open("rb")
    return _s3().get_object(Bucket=settings.s3_bucket, Key=key)["Body"]


def delete_key(key: str) -> None:
    if settings.storage_backend == "local":
        p = DATA_DIR / key
        if p.is_file():
            p.unlink()
        return
    with contextlib.suppress(ClientError):
        _s3().delete_object(Bucket=settings.s3_bucket, Key=key)


def delete_prefix(prefix: str) -> None:
    if settings.storage_backend == "local":
        p = DATA_DIR / prefix
        if p.is_dir():
            shutil.rmtree(p, ignore_errors=True)
        elif p.is_file():
            p.unlink()
        return
    s3 = _s3()
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            s3.delete_object(Bucket=settings.s3_bucket, Key=obj["Key"])


# ---------------------------------------------------------------------------
# Job lifecycle helpers
# ---------------------------------------------------------------------------

def remove_input(job_id) -> None:
    delete_prefix(f"in/{job_id}")
    shutil.rmtree(scratch_dir(job_id), ignore_errors=True)


def remove_job_files(job_id) -> None:
    delete_prefix(f"in/{job_id}")
    delete_prefix(f"out/{job_id}")
    shutil.rmtree(scratch_dir(job_id), ignore_errors=True)


def remove_scratch(job_id) -> None:
    shutil.rmtree(scratch_dir(job_id), ignore_errors=True)


# ---------------------------------------------------------------------------
# Content-addressed cache
# ---------------------------------------------------------------------------

def cached_result(sha256: str) -> str | None:
    key = cache_key(sha256, "result.mp4")
    if object_exists(key):
        if settings.storage_backend == "s3" and _s3_size(key) == 0:
            return None
        return key
    return None


def save_to_cache(sha256: str, out_dir: Path) -> None:
    for name in _CACHE_FILES:
        src = out_dir / name
        if src.exists() and src.stat().st_size > 0:
            write_file(cache_key(sha256, name), src)


def purge_stale_cache(max_age_sec: int) -> int:
    """Delete content-addressed cache entries whose newest object is older than
    ``max_age_sec``. Returns the number of cache prefixes removed.

    The dedup cache holds a copy of every processed result keyed by input hash.
    Left unbounded it grows forever and retains user content indefinitely, so we
    expire it on a TTL just like job results. ``max_age_sec <= 0`` keeps it.
    """
    if max_age_sec <= 0:
        return 0
    cutoff = time.time() - max_age_sec
    purged = 0

    if settings.storage_backend == "local":
        root = DATA_DIR / "cache"
        if not root.is_dir():
            return 0
        for entry in root.iterdir():
            if not entry.is_dir():
                continue
            try:
                mtime = max(
                    (f.stat().st_mtime for f in entry.iterdir()),
                    default=entry.stat().st_mtime,
                )
            except OSError:
                continue
            if mtime < cutoff:
                shutil.rmtree(entry, ignore_errors=True)
                purged += 1
        return purged

    # S3: group objects by ``cache/<sha>/`` prefix, drop a prefix once its newest
    # object has aged out.
    s3 = _s3()
    paginator = s3.get_paginator("list_objects_v2")
    newest: dict[str, float] = {}
    keys: dict[str, list[str]] = {}
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix="cache/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            parts = key.split("/")
            if len(parts) < 3:
                continue
            prefix = "/".join(parts[:2])  # cache/<sha>
            ts = obj["LastModified"].timestamp()
            newest[prefix] = max(newest.get(prefix, 0.0), ts)
            keys.setdefault(prefix, []).append(key)
    for prefix, ts in newest.items():
        if ts < cutoff:
            for key in keys[prefix]:
                with contextlib.suppress(ClientError):
                    s3.delete_object(Bucket=settings.s3_bucket, Key=key)
            purged += 1
    return purged


def restore_from_cache(sha256: str, job_id) -> dict[str, str]:
    """Copy cached objects into this job's output prefix. Returns key map."""
    out: dict[str, str] = {}
    for name in _CACHE_FILES:
        src_key = cache_key(sha256, name)
        if not object_exists(src_key):
            continue
        dst_key = output_key(job_id, name)
        if settings.storage_backend == "local":
            dest = ensure_dir(output_dir(job_id)) / name
            shutil.copy2(DATA_DIR / src_key, dest)
        else:
            s3 = _s3()
            s3.copy_object(
                Bucket=settings.s3_bucket,
                CopySource={"Bucket": settings.s3_bucket, "Key": src_key},
                Key=dst_key,
            )
        out[name] = dst_key
    return out


def prepare_worker_input(job_id, input_rel: str) -> Path:
    """Download the upload to local scratch for ffmpeg / the Veo binary."""
    local = scratch_input(job_id)
    download_to_path(input_rel, local)
    return local


def publish_worker_output(job_id, out_dir: Path) -> dict[str, str]:
    """Upload processed files from scratch to durable storage."""
    published: dict[str, str] = {}
    for name in _CACHE_FILES:
        src = out_dir / name
        if src.exists() and src.stat().st_size > 0:
            key = output_key(job_id, name)
            write_file(key, src)
            published[name] = key
    return published
