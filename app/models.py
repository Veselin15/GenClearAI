import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class JobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    finished = "finished"
    skipped = "skipped"        # no supported watermark detected (not an error)
    failed = "failed"
    expired = "expired"        # result deleted after its TTL
    canceled = "canceled"


# One shared enum type so create_all emits a single PostgreSQL ``job_status`` type.
JobStatusType = SAEnum(JobStatus, name="job_status")

TERMINAL_STATUSES = {
    JobStatus.finished,
    JobStatus.skipped,
    JobStatus.failed,
    JobStatus.expired,
    JobStatus.canceled,
}


class Plan(str, enum.Enum):
    free = "free"
    pro = "pro"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Web users authenticate with a password; programmatic users with an API key.
    # Either may be null depending on how the account was created.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    api_key_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    google_sub: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)

    plan: Mapped[str] = mapped_column(String(16), default=Plan.free.value, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    credits_reset_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Stripe subscription
    stripe_customer_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # engagement / growth
    referral_code: Mapped[str | None] = mapped_column(
        String(16), unique=True, index=True, nullable=True
    )
    referred_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    last_credit_grant: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    videos_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    quota_bytes: Mapped[int] = mapped_column(
        BigInteger, default=5 * 1024**3, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    jobs: Mapped[list["Job"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    guest_session_id: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True
    )
    status: Mapped[JobStatus] = mapped_column(
        JobStatusType, default=JobStatus.pending, index=True
    )
    progress: Mapped[int] = mapped_column(SmallInteger, default=0)
    priority: Mapped[int] = mapped_column(SmallInteger, default=0, index=True)

    # file metadata captured at validation time
    original_name: Mapped[str] = mapped_column(String(512))
    mime_type: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    duration_sec: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # storage paths are relative to DATA_DIR so the mount can move
    input_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    # results / errors
    watermark_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    exit_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempts: Mapped[int] = mapped_column(SmallInteger, default=0)
    from_cache: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # before/after preview thumbnails (relative paths under DATA_DIR)
    thumb_before: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumb_after: Mapped[str | None] = mapped_column(Text, nullable=True)

    # delivery + lifecycle
    webhook_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    processing_sec: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    user: Mapped["User"] = relationship(back_populates="jobs")


class JobEvent(Base):
    """Append-only status trail, useful for debugging stuck jobs."""

    __tablename__ = "job_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[JobStatus] = mapped_column(JobStatusType)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
