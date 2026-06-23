"""Database engines/sessions.

The API runs async (asyncpg); the Celery worker runs sync (psycopg2). Both share
the same ORM models from ``app.models``.
"""
from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings

settings = get_settings()

# Async engine + session — used by the FastAPI app.
async_engine = create_async_engine(settings.database_url, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(
    async_engine, expire_on_commit=False, class_=AsyncSession
)

# Sync engine + session — used by the Celery worker (Celery is not async-native).
sync_engine = create_engine(settings.sync_database_url, pool_pre_ping=True, future=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False, class_=Session)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
