from datetime import datetime, timezone
import logging

from authlib.integrations.base_client.errors import OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
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
from ..credits import maybe_reset_monthly_credits
from ..db import get_db
from ..engagement import build_engagement
from ..models import Job, JobStatus, Plan, User
from ..queue_util import avg_processing_sec, queue_depth
from ..rate_limit import rate_limit_ip
from ..schemas import (
    ActivityItem,
    ApiKeyOut,
    BadgeOut,
    LevelOut,
    LoginIn,
    MeOut,
    OnboardingOut,
    RegisterIn,
    StatsOut,
    UpdateMeIn,
    UserSummaryOut,
)
from ..security import generate_api_key, generate_referral_code, hash_api_key

from ..oauth import GOOGLE_USERINFO_URL, oauth

settings = get_settings()
router = APIRouter(prefix="/api")
log = logging.getLogger(__name__)


async def _me(user: User, db: AsyncSession) -> MeOut:
    out = MeOut.model_validate(user)
    out.has_api_key = user.api_key_hash is not None
    out.auth_provider = "google" if user.google_sub else ("password" if user.password_hash else None)
    eng = await build_engagement(db, user)
    out.badges = [BadgeOut(**b) for b in eng["badges"]]
    out.onboarding = OnboardingOut(**eng["onboarding"])
    out.referral_count = eng["referral_count"]
    out.level = LevelOut(**eng["level"])
    return out


def _apply_monthly_credits(user: User) -> bool:
    return maybe_reset_monthly_credits(user)


async def _unique_referral_code(db: AsyncSession) -> str:
    for _ in range(10):
        code = generate_referral_code()
        if not await db.scalar(select(User.id).where(User.referral_code == code)):
            return code
    return generate_referral_code()


def _maybe_daily_bonus(user: User) -> int:
    """Deprecated — monthly credits replaced daily drip. Kept for API compat."""
    return 0


async def _google_profile(token: dict) -> dict:
    info = token.get("userinfo")
    if info:
        return info
    resp = await oauth.google.get(GOOGLE_USERINFO_URL, token=token)
    resp.raise_for_status()
    return resp.json()


@router.get("/auth/google")
async def google_login(request: Request):
    if not settings.google_client_id:
        raise HTTPException(503, "Google sign-in is not configured")
    redirect_uri = f"{settings.api_base_url.rstrip('/')}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def google_callback(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(503, "Google sign-in is not configured")
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as exc:
        log.warning("Google OAuth token exchange failed: %s", exc)
        raise HTTPException(
            400,
            "Google sign-in expired or was interrupted — please try again from the login page",
        ) from exc

    try:
        info = await _google_profile(token)
    except Exception as exc:
        log.exception("Google userinfo fetch failed")
        raise HTTPException(400, "could not retrieve Google profile") from exc

    if not info.get("email"):
        raise HTTPException(400, "could not retrieve Google profile")

    email = info["email"].lower()
    google_sub = info["sub"]
    user = await db.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = await db.scalar(select(User).where(User.email == email))
        if user:
            user.google_sub = google_sub
            if not user.full_name and info.get("name"):
                user.full_name = info["name"]
        else:
            user = User(
                email=email,
                full_name=info.get("name"),
                google_sub=google_sub,
                plan=Plan.free.value,
                credits=settings.free_credits,
                referral_code=await _unique_referral_code(db),
                credits_reset_at=datetime.now(timezone.utc).replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                ),
            )
            db.add(user)

    if user.is_active is False:
        raise HTTPException(403, "account disabled")
    if user.is_active is None:
        user.is_active = True

    _apply_monthly_credits(user)
    await db.commit()
    await db.refresh(user)

    redirect = RedirectResponse(url=f"{settings.frontend_url}/app", status_code=302)
    issue_session(redirect, user.id)
    return redirect


@router.post("/auth/register", response_model=MeOut, status_code=201)
async def register(
    payload: RegisterIn,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    rate_limit_ip(request, "register", settings.register_rate_limit)
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
        credits_reset_at=datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        ),
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
async def login(
    payload: LoginIn,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    rate_limit_ip(request, "login", settings.login_rate_limit)
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "invalid email or password")
    if user.is_active is False:
        raise HTTPException(403, "account disabled")
    reset = _apply_monthly_credits(user)
    if reset:
        await db.commit()
        await db.refresh(user)
    issue_session(response, user.id)
    out = await _me(user, db)
    out.daily_bonus = 0
    return out


@router.post("/auth/logout", status_code=204)
async def logout(response: Response):
    clear_session(response)


@router.get("/me", response_model=MeOut)
async def me(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    reset = _apply_monthly_credits(user)
    if reset:
        await db.commit()
        await db.refresh(user)
    return await _me(user, db)


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


@router.get("/me/summary", response_model=UserSummaryOut)
async def me_summary(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    total = await db.scalar(
        select(func.coalesce(func.sum(Job.processing_sec), 0)).where(
            Job.user_id == user.id, Job.status == JobStatus.finished
        )
    )
    cache_hits = await db.scalar(
        select(func.count()).select_from(Job).where(
            Job.user_id == user.id, Job.from_cache.is_(True)
        )
    )
    finished = await db.scalar(
        select(func.count()).select_from(Job).where(
            Job.user_id == user.id, Job.status == JobStatus.finished
        )
    )
    return UserSummaryOut(
        total_processing_sec=round(float(total or 0), 1),
        cache_hits=cache_hits or 0,
        finished_jobs=finished or 0,
    )


@router.get("/activity", response_model=list[ActivityItem])
async def activity(db: AsyncSession = Depends(get_db)):
    """Anonymized recent completions for social proof on the landing page."""
    rows = await db.scalars(
        select(Job)
        .where(Job.status == JobStatus.finished, Job.finished_at.is_not(None))
        .order_by(Job.finished_at.desc())
        .limit(15)
    )
    out: list[ActivityItem] = []
    for j in rows:
        res = f"{j.width}×{j.height}" if j.width and j.height else None
        out.append(
            ActivityItem(
                watermark_type=j.watermark_type,
                resolution=res,
                from_cache=j.from_cache,
                processing_sec=float(j.processing_sec) if j.processing_sec else None,
                at=j.finished_at,
            )
        )
    return out
