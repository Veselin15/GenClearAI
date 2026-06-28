"""Lightweight schema patches for single-node deploys (no Alembic yet)."""
from sqlalchemy import text

from .db import async_engine, sync_engine

_PATCHES = [
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS priority SMALLINT NOT NULL DEFAULT 0",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processing_sec NUMERIC(10, 2)",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_width INTEGER",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_height INTEGER",
  "ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(64)",
  "CREATE INDEX IF NOT EXISTS ix_jobs_guest_session_id ON jobs (guest_session_id)",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(128)",
  "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(64)",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(64)",
]


# Schema patches are idempotent but cheap to skip; run at most once per process.
_async_done = False
_sync_done = False


async def run_async_migrations() -> None:
    global _async_done
    if _async_done:
        return
    async with async_engine.begin() as conn:
        for stmt in _PATCHES:
            await conn.execute(text(stmt))
    _async_done = True


def run_sync_migrations() -> None:
    global _sync_done
    if _sync_done:
        return
    with sync_engine.begin() as conn:
        for stmt in _PATCHES:
            conn.execute(text(stmt))
    _sync_done = True
