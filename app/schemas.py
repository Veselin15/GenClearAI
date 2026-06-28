import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import JobStatus


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=200)
    referral_code: str | None = Field(default=None, max_length=16)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UpdateMeIn(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class BadgeOut(BaseModel):
    id: str
    title: str
    desc: str


class OnboardingOut(BaseModel):
    upload_first: bool
    download_result: bool
    share_referral: bool
    complete: bool


class LevelOut(BaseModel):
    level_name: str
    level_icon: str
    level_min: int
    level_progress: int
    videos_to_next: int
    next_level_name: str | None = None


class MeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    plan: str
    credits: int
    created_at: datetime
    videos_processed: int = 0
    referral_code: str | None = None
    has_api_key: bool = False
    daily_bonus: int = 0
    streak_days: int = 0
    credits_reset_at: datetime | None = None
    auth_provider: str | None = None
    badges: list[BadgeOut] = []
    onboarding: OnboardingOut | None = None
    referral_count: int = 0
    level: LevelOut | None = None


class ActivityItem(BaseModel):
    watermark_type: str | None = None
    resolution: str | None = None
    from_cache: bool = False
    processing_sec: float | None = None
    at: datetime


class UserSummaryOut(BaseModel):
    total_processing_sec: float
    cache_hits: int
    finished_jobs: int


class ApiKeyOut(BaseModel):
    api_key: str


class StatsOut(BaseModel):
    videos_cleaned: int
    users: int
    avg_processing_sec: float | None = None
    queue_depth: int = 0
    cache_hits: int = 0


class JobCreateResponse(BaseModel):
    job_id: uuid.UUID
    status: JobStatus
    status_url: str
    events_url: str
    eta_sec: int | None = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: JobStatus
    progress: int
    original_name: str
    watermark_type: str | None = None
    error_message: str | None = None
    duration_sec: float | None = None
    width: int | None = None
    height: int | None = None
    output_width: int | None = None
    output_height: int | None = None
    created_at: datetime
    finished_at: datetime | None = None
    expires_at: datetime | None = None
    from_cache: bool = False
    processing_sec: float | None = None

    download_url: str | None = None
    queue_position: int | None = None
    eta_sec: int | None = None
    has_preview: bool = False
    quality_matched: bool | None = None


class GuestJobOut(JobOut):
    requires_registration: bool = False


class CheckoutOut(BaseModel):
    url: str
