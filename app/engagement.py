"""User achievements and onboarding progress (computed, not stored)."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Job, JobStatus, User

ACHIEVEMENTS = {
    "first_clean": ("First clean", "Processed your first video"),
    "power_user": ("Power user", "Cleaned 5+ videos"),
    "streak_3": ("On a roll", "3-day login streak"),
    "referrer": ("Community builder", "Referred a friend who joined"),
    "instant_fan": ("Instant fan", "Got a cache-hit instant result"),
}


async def referral_count(db: AsyncSession, user_id) -> int:
    return await db.scalar(
        select(func.count()).select_from(User).where(User.referred_by == user_id)
    ) or 0


async def had_cache_hit(db: AsyncSession, user_id) -> bool:
    hit = await db.scalar(
        select(Job.id)
        .where(Job.user_id == user_id, Job.from_cache.is_(True))
        .limit(1)
    )
    return hit is not None


async def build_engagement(db: AsyncSession, user: User) -> dict:
    refs = await referral_count(db, user.id)
    cache_hit = await had_cache_hit(db, user.id)
    earned: list[str] = []
    if user.videos_processed >= 1:
        earned.append("first_clean")
    if user.videos_processed >= 5:
        earned.append("power_user")
    if user.streak_days >= 3:
        earned.append("streak_3")
    if refs > 0:
        earned.append("referrer")
    if cache_hit:
        earned.append("instant_fan")

    badges = [
        {"id": k, "title": ACHIEVEMENTS[k][0], "desc": ACHIEVEMENTS[k][1]}
        for k in earned
    ]

    finished = user.videos_processed > 0
    onboarding = {
        "upload_first": finished,
        "download_result": finished,
        "share_referral": refs > 0,
        "complete": finished and refs > 0,
    }
    return {"badges": badges, "onboarding": onboarding, "referral_count": refs}
