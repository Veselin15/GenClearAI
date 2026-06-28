"""Monthly credit allowance for the registered free tier."""
from datetime import datetime, timezone

from sqlalchemy import update

from .config import get_settings
from .models import Plan, User

settings = get_settings()


def _month_start(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def maybe_reset_monthly_credits(user: User) -> bool:
    """Reset free-tier credits at the start of each calendar month. Returns True if reset."""
    if user.plan != Plan.free.value:
        return False
    now = datetime.now(timezone.utc)
    period_start = _month_start(now)
    if user.credits_reset_at is not None and user.credits_reset_at >= period_start:
        return False
    user.credits = settings.monthly_free_credits
    user.credits_reset_at = period_start
    return True


async def reset_all_monthly_credits(session) -> int:
    """Batch reset run by Celery on the 1st of each month."""
    now = datetime.now(timezone.utc)
    period_start = _month_start(now)
    result = session.execute(
        update(User)
        .where(
            User.plan == Plan.free.value,
            (User.credits_reset_at.is_(None)) | (User.credits_reset_at < period_start),
        )
        .values(credits=settings.monthly_free_credits, credits_reset_at=period_start)
    )
    session.commit()
    return result.rowcount or 0
