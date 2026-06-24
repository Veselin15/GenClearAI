"""User achievements and onboarding progress (computed, not stored)."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Job, JobStatus, User

ACHIEVEMENTS = {
    "first_clean": ("First clean", "Processed your first video"),
    "power_user": ("Power user", "Cleaned 5+ videos"),
    "streak_3": ("On a roll", "3-day login streak"),
    "streak_7": ("Dedicated", "7-day login streak"),
    "referrer": ("Community builder", "Referred a friend who joined"),
    "instant_fan": ("Instant fan", "Got a cache-hit instant result"),
    "studio": ("Studio grade", "Cleaned 15+ videos"),
}

LEVELS: list[tuple[int, str, str]] = [
    (0, "Newcomer", "🌱"),
    (1, "Creator", "🎬"),
    (5, "Regular", "⚡"),
    (15, "Studio", "✦"),
    (50, "Legend", "👑"),
]


def user_level(videos_processed: int) -> dict:
    current = LEVELS[0]
    next_lvl = LEVELS[1] if len(LEVELS) > 1 else None
    for i, lvl in enumerate(LEVELS):
        if videos_processed >= lvl[0]:
            current = lvl
            next_lvl = LEVELS[i + 1] if i + 1 < len(LEVELS) else None
    if next_lvl:
        span = next_lvl[0] - current[0]
        progress = videos_processed - current[0]
        pct = min(100, int((progress / span) * 100)) if span else 100
        videos_to_next = next_lvl[0] - videos_processed
    else:
        pct = 100
        videos_to_next = 0
    return {
        "level_name": current[1],
        "level_icon": current[2],
        "level_min": current[0],
        "level_progress": pct,
        "videos_to_next": max(videos_to_next, 0),
        "next_level_name": next_lvl[1] if next_lvl else None,
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
    if user.videos_processed >= 15:
        earned.append("studio")
    if user.streak_days >= 3:
        earned.append("streak_3")
    if user.streak_days >= 7:
        earned.append("streak_7")
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
    return {
        "badges": badges,
        "onboarding": onboarding,
        "referral_count": refs,
        "level": user_level(user.videos_processed),
    }
