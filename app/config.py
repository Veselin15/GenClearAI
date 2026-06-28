import logging
import warnings
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_log = logging.getLogger(__name__)


_DEFAULT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- core ---
    app_name: str = "GenClear Watermark Service"
    environment: Literal["development", "production"] = "development"
    log_level: str = "INFO"                              # root log level
    secret_key: str = _DEFAULT_SECRET                    # signs download tokens + webhooks
    api_base_url: str = "http://localhost"               # used to build absolute URLs
    cors_origins: str = "http://localhost:3000"          # comma-separated; empty = disabled
    enable_docs: bool | None = None                      # None = on in dev, off in prod

    # --- database ---
    database_url: str = "postgresql+asyncpg://genclear:genclear@db:5432/genclear"
    sync_database_url: str = "postgresql+psycopg2://genclear:genclear@db:5432/genclear"

    # --- redis / celery ---
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    # --- storage ---
    storage_backend: Literal["s3", "local"] = "s3"
    data_dir: str = "/data"                              # local scratch + local-backend root
    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "genclear"
    s3_secret_key: str = "genclear-secret"
    s3_bucket: str = "genclear"
    s3_region: str = "us-east-1"
    result_ttl_hours: int = 48
    cache_ttl_hours: int = 72                            # purge dedup cache entries after this (0 = keep forever)
    stuck_job_grace_sec: int = 300                       # extra slack past the hard timeout before reaping orphaned jobs

    # --- upload limits / validation ---
    max_upload_bytes: int = 1024 * 1024 * 1024           # 1 GiB
    max_duration_sec: int = 600                          # 10 minutes
    max_pixels: int = 1920 * 1080                        # cap resolution (1080p)
    max_pending_jobs_per_user: int = 5                   # back-pressure per user
    allowed_mime: tuple[str, ...] = (
        "video/mp4", "video/x-matroska", "video/quicktime",
    )
    allowed_video_codecs: tuple[str, ...] = (
        "h264", "hevc", "mpeg4", "vp9", "av1",
    )

    # --- processing ---
    tool_bin: str = "/opt/veo/GeminiWatermarkTool-Video"
    tool_extra_args: str = ""                            # e.g. "--ml"
    job_timeout_sec: int = 1800                          # hard kill the binary after 30 min

    # --- download tokens ---
    download_token_max_age: int = 48 * 3600

    # --- accounts / sessions / trial ---
    session_max_age: int = 30 * 24 * 3600        # 30 days
    cookie_secure: bool = False                  # set True behind HTTPS in production
    free_credits: int = 3                        # monthly allowance for registered free tier
    monthly_free_credits: int = 3                # reset to this on the 1st of each month

    # --- anonymous guest tier (PLG funnel) ---
    guest_jobs_limit: int = 1                    # free cleans per guest session
    guest_rate_limit: int = 3                    # max guest uploads per hour per IP
    guest_result_ttl_hours: int = 24             # shorter TTL for anonymous results

    # --- engagement / growth ---
    referral_bonus: int = 2                      # credits to BOTH parties on a referral
    pro_queue_priority: int = 9                # Celery priority 0-9 (higher = sooner)
    pro_result_ttl_hours: int = 1                # near-instant purge for paid tiers

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: str = ""
    frontend_url: str = "http://localhost:3000"  # OAuth redirect + Stripe return URLs

    # --- Stripe billing ---
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_monthly: str = ""               # price_xxx for Pro monthly
    stripe_price_yearly: str = ""                # price_xxx for Pro yearly

    # --- rate limiting ---
    login_rate_limit: int = 10                  # max login attempts per minute per IP
    register_rate_limit: int = 5                # max registrations per minute per IP
    upload_rate_limit: int = 20                 # max uploads per minute per user

    # --- previews ---
    thumb_width: int = 1080                     # compare previews — match source up to thumb_max
    thumb_max_width: int = 1280
    output_crf: int = 14                        # high-quality repair encode if res drifts
    ensure_output_resolution: bool = True       # upscale/re-encode if tool shrinks frames

    @property
    def session_cookie_domain(self) -> str | None:
        """Share session cookies across apex + www in production."""
        if not self.cookie_secure:
            return None
        from urllib.parse import urlparse

        host = urlparse(self.frontend_url).hostname or ""
        if not host or host in ("localhost", "127.0.0.1"):
            return None
        base = host.removeprefix("www.")
        return f".{base}" if "." in base else None

    @property
    def cors_origin_list(self) -> list[str]:
        if not self.cors_origins.strip():
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def docs_enabled(self) -> bool:
        # Interactive docs default on in dev, off in prod unless explicitly enabled.
        if self.enable_docs is not None:
            return self.enable_docs
        return not self.is_production


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.secret_key == _DEFAULT_SECRET:
        if s.is_production:
            raise RuntimeError(
                "SECRET_KEY is the insecure default but ENVIRONMENT=production. "
                "Set a strong random SECRET_KEY (e.g. `openssl rand -hex 32`) before deploying."
            )
        warnings.warn(
            "SECRET_KEY is the insecure default — set a strong random value "
            "via the SECRET_KEY environment variable before deploying",
            stacklevel=2,
        )
    return s
