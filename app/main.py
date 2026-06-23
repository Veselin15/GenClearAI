import asyncio
import contextlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import storage, webhooks
from .config import get_settings
from .db import async_engine
from .db_migrate import run_async_migrations
from .models import Base
from .routers import auth, jobs

settings = get_settings()


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    storage.ensure_bucket()
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await run_async_migrations()
    listener = asyncio.create_task(webhooks.listen())
    yield
    listener.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await listener
    await async_engine.dispose()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(jobs.router)


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}
