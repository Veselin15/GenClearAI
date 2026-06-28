"""Authentication: password hashing, signed session cookies, and a
``current_user`` dependency that accepts either a browser session cookie or a
programmatic ``Authorization: Bearer <api_key>`` header.
"""
import uuid

import bcrypt
from fastapi import Cookie, Depends, Header, HTTPException, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .db import get_db
from .models import User
from .security import hash_api_key

settings = get_settings()
COOKIE_NAME = "genclear_session"
GUEST_COOKIE_NAME = "genclear_guest"
_session = URLSafeTimedSerializer(settings.secret_key, salt="session")
_guest = URLSafeTimedSerializer(settings.secret_key, salt="guest")


# --- passwords ------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode())
    except ValueError:
        return False


# --- session cookies ------------------------------------------------------
def issue_session(response: Response, user_id) -> None:
    response.set_cookie(
        COOKIE_NAME,
        _session.dumps(str(user_id)),
        max_age=settings.session_max_age,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


# --- guest session cookies (anonymous PLG tier) ---------------------------
def issue_guest_session(response: Response, guest_id: str) -> None:
    response.set_cookie(
        GUEST_COOKIE_NAME,
        _guest.dumps(guest_id),
        max_age=30 * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


def guest_id_from_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        return _guest.loads(token, max_age=30 * 24 * 3600)
    except (BadSignature, SignatureExpired):
        return None


def user_id_from_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        return _session.loads(token, max_age=settings.session_max_age)
    except (BadSignature, SignatureExpired):
        return None


# --- dependencies ---------------------------------------------------------
async def _lookup(db: AsyncSession, cookie: str | None, authorization: str | None) -> User | None:
    uid = user_id_from_token(cookie)
    if uid:
        try:
            user = await db.get(User, uuid.UUID(uid))
        except ValueError:
            user = None
        if user:
            return user
    if authorization and authorization.startswith("Bearer "):
        key = authorization.split(" ", 1)[1]
        res = await db.execute(select(User).where(User.api_key_hash == hash_api_key(key)))
        return res.scalar_one_or_none()
    return None


async def current_user(
    genclear_session: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await _lookup(db, genclear_session, authorization)
    if user is None or not user.is_active:
        raise HTTPException(401, "not authenticated")
    return user


async def optional_user(
    genclear_session: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    user = await _lookup(db, genclear_session, authorization)
    if user is None or not user.is_active:
        return None
    return user
