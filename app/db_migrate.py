"""Lightweight schema patches for single-node deploys (no Alembic yet)."""
from sqlalchemy import text

from .db import async_engine, sync_engine

_PATCHES = [
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS priority SMALLINT NOT NULL DEFAULT 0",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processing_sec NUMERIC(10, 2)",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_width INTEGER",
  "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS output_height INTEGER",
]


async def run_async_migrations() -> None:
    async with async_engine.begin() as conn:
        for stmt in _PATCHES:
            await conn.execute(text(stmt))


def run_sync_migrations() -> None:
    with sync_engine.begin() as conn:
        for stmt in _PATCHES:
            conn.execute(text(stmt))
