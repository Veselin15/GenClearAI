from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- core ---
    app_name: str = "GenClear Watermark Service"
    secret_key: str = "change-me-in-production"          # signs download tokens + webhooks
    api_base_url: str = "http://localhost"               # used to build absolute URLs
    cors_origins: str = "http://localhost:3000"          # comma-separated; empty = disabled

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
    free_credits: int = 3                        # videos a new free account can process

    # --- engagement / growth ---
    daily_bonus_credits: int = 1                 # free credits granted once per day
    daily_bonus_cap: int = 5                     # don't top up past this
    referral_bonus: int = 2                      # credits to BOTH parties on a referral
    pro_queue_priority: int = 9                # Celery priority 0-9 (higher = sooner)

    # --- previews ---
    thumb_width: int = 480                       # smaller = faster ffmpeg previews

    @property
    def cors_origin_list(self) -> list[str]:
        if not self.cors_origins.strip():
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
