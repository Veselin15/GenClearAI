from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import (
    clear_session,
    current_user,
    hash_password,
    issue_session,
    verify_password,
)
from ..config import get_settings
from ..db import get_db
from ..engagement import build_engagement
from ..models import Job, JobStatus, Plan, User
from ..queue_util import avg_processing_sec, queue_depth
from ..schemas import ApiKeyOut, BadgeOut, LoginIn, MeOut, OnboardingOut, RegisterIn, StatsOut, UpdateMeIn
from ..security import generate_api_key, generate_referral_code, hash_api_key

settings = get_settings()
router = APIRouter(prefix="/api")


async def _me(user: User, db: AsyncSession) -> MeOut:
    out = MeOut.model_validate(user)
    out.has_api_key = user.api_key_hash is not None
    eng = await build_engagement(db, user)
    out.badges = [BadgeOut(**b) for b in eng["badges"]]
    out.onboarding = OnboardingOut(**eng["onboarding"])
    out.referral_count = eng["referral_count"]
    return out


async def _unique_referral_code(db: AsyncSession) -> str:
    for _ in range(10):
        code = generate_referral_code()
        if not await db.scalar(select(User.id).where(User.referral_code == code)):
            return code
    return generate_referral_code()


def _maybe_daily_bonus(user: User) -> int:
    if user.plan != Plan.free.value or user.credits >= settings.daily_bonus_cap:
        return 0
    now = datetime.now(timezone.utc)
    last = user.last_credit_grant
    if last is not None and (now - last) < timedelta(hours=24):
        return 0
    if last is not None and (now.date() - last.date()).days == 1:
        user.streak_days += 1
    else:
        user.streak_days = 1
    user.credits += settings.daily_bonus_credits
    user.last_credit_grant = now
    return settings.daily_bonus_credits


@router.post("/auth/register", response_model=MeOut, status_code=201)
async def register(payload: RegisterIn, response: Response, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, "an account with this email already exists")

    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        plan=Plan.free.value,
        credits=settings.free_credits,
        referral_code=await _unique_referral_code(db),
        last_credit_grant=datetime.now(timezone.utc),
        streak_days=1,
    )

    if payload.referral_code:
        referrer = await db.scalar(
            select(User).where(User.referral_code == payload.referral_code.strip().upper())
        )
        if referrer:
            user.referred_by = referrer.id
            user.credits += settings.referral_bonus
            referrer.credits += settings.referral_bonus

    db.add(user)
    await db.commit()
    await db.refresh(user)
    issue_session(response, user.id)
    return await _me(user, db)


@router.post("/auth/login", response_model=MeOut)
async def login(payload: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "account disabled")
    issue_session(response, user.id)
    return await _me(user, db)


@router.post("/auth/logout", status_code=204)
async def logout(response: Response):
    clear_session(response)


@router.get("/me", response_model=MeOut)
async def me(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    granted = _maybe_daily_bonus(user)
    if granted:
        await db.commit()
        await db.refresh(user)
    out = await _me(user, db)
    out.daily_bonus = granted
    return out


@router.patch("/me", response_model=MeOut)
async def update_me(
    payload: UpdateMeIn,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.password:
        user.password_hash = hash_password(payload.password)
    await db.commit()
    await db.refresh(user)
    return await _me(user, db)


@router.post("/me/api-key", response_model=ApiKeyOut)
async def rotate_api_key(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    key = generate_api_key()
    user.api_key_hash = hash_api_key(key)
    await db.commit()
    return ApiKeyOut(api_key=key)


@router.get("/stats", response_model=StatsOut)
async def stats(db: AsyncSession = Depends(get_db)):
    cleaned = await db.scalar(
        select(func.count()).select_from(Job).where(Job.status == JobStatus.finished)
    )
    users = await db.scalar(select(func.count()).select_from(User))
    cache_hits = await db.scalar(
        select(func.count()).select_from(Job).where(Job.from_cache.is_(True))
    )
    avg = await avg_processing_sec(db)
    depth = await queue_depth(db)
    return StatsOut(
        videos_cleaned=cleaned or 0,
        users=users or 0,
        avg_processing_sec=round(avg, 1) if avg else None,
        queue_depth=depth,
        cache_hits=cache_hits or 0,
    )
