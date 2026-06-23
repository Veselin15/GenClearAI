"""Queue ETA estimates and priority helpers."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .models import Job, JobStatus, Plan, User

settings = get_settings()

DEFAULT_AVG_SEC = 120.0  # fallback before we have history


def job_priority(user: User) -> int:
    if user.plan == Plan.pro.value:
        return settings.pro_queue_priority
    return 0


async def avg_processing_sec(db: AsyncSession) -> float:
    """Rolling median-ish average from recent successful jobs."""
    rows = await db.scalars(
        select(Job.processing_sec)
        .where(
            Job.status == JobStatus.finished,
            Job.processing_sec.is_not(None),
            Job.from_cache.is_(False),
        )
        .order_by(Job.finished_at.desc())
        .limit(25)
    )
    samples = [float(x) for x in rows if x and float(x) > 0]
    if not samples:
        return DEFAULT_AVG_SEC
    return sum(samples) / len(samples)


async def jobs_ahead(db: AsyncSession, job: Job) -> int:
    """How many jobs are ahead of this one in the fair queue."""
    higher = await db.scalar(
        select(func.count())
        .select_from(Job)
        .where(Job.status == JobStatus.pending, Job.priority > job.priority)
    )
    same_prio_older = await db.scalar(
        select(func.count())
        .select_from(Job)
        .where(
            Job.status == JobStatus.pending,
            Job.priority == job.priority,
            Job.created_at < job.created_at,
        )
    )
    processing = await db.scalar(
        select(func.count()).select_from(Job).where(Job.status == JobStatus.processing)
    )
    return (higher or 0) + (same_prio_older or 0) + (processing or 0)


async def estimate_wait_sec(db: AsyncSession, job: Job) -> int | None:
    if job.status != JobStatus.pending:
        return None
    ahead = await jobs_ahead(db, job)
    avg = await avg_processing_sec(db)
    return int(ahead * avg)


async def queue_depth(db: AsyncSession) -> int:
    pending = await db.scalar(
        select(func.count()).select_from(Job).where(Job.status == JobStatus.pending)
    )
    processing = await db.scalar(
        select(func.count()).select_from(Job).where(Job.status == JobStatus.processing)
    )
    return (pending or 0) + (processing or 0)
