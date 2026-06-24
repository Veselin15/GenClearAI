import asyncio
import contextlib
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

log = logging.getLogger(__name__)

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())[:8]
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if request.url.path.startswith("/v1/jobs") and request.method == "GET":
            response.headers["Cache-Control"] = "no-store"
        return response


app.add_middleware(SecurityHeadersMiddleware)

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}
