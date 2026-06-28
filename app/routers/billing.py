"""Stripe Checkout, Customer Portal, and webhook handlers."""
import logging
import uuid

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import current_user
from ..config import get_settings
from ..db import get_db
from ..models import Plan, User

settings = get_settings()
router = APIRouter(prefix="/api/billing")
log = logging.getLogger(__name__)


def _stripe_ready() -> bool:
    return bool(settings.stripe_secret_key and settings.stripe_price_monthly)


@router.post("/checkout")
async def create_checkout(
    yearly: bool = False,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _stripe_ready():
        raise HTTPException(503, "billing is not configured on this instance")
    if user.plan == Plan.pro.value:
        raise HTTPException(400, "already on Pro")

    stripe.api_key = settings.stripe_secret_key
    price = settings.stripe_price_yearly if yearly else settings.stripe_price_monthly
    if yearly and not price:
        price = settings.stripe_price_monthly

    kwargs: dict = {
        "mode": "subscription",
        "line_items": [{"price": price, "quantity": 1}],
        "success_url": f"{settings.frontend_url}/account?upgraded=1",
        "cancel_url": f"{settings.frontend_url}/account",
        "metadata": {"user_id": str(user.id)},
        "allow_promotion_codes": True,
    }
    if user.stripe_customer_id:
        kwargs["customer"] = user.stripe_customer_id
    else:
        kwargs["customer_email"] = user.email

    session = stripe.checkout.Session.create(**kwargs)
    return {"url": session.url}


@router.post("/portal")
async def customer_portal(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _stripe_ready():
        raise HTTPException(503, "billing is not configured on this instance")
    if not user.stripe_customer_id:
        raise HTTPException(400, "no active subscription")

    stripe.api_key = settings.stripe_secret_key
    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/account",
    )
    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "webhook not configured")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(400, "invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            user = await db.get(User, uuid.UUID(user_id))
            if user:
                user.plan = Plan.pro.value
                user.stripe_customer_id = session.get("customer")
                user.stripe_subscription_id = session.get("subscription")
                await db.commit()
                log.info("Upgraded user %s to Pro via Stripe", user_id)

    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.updated"):
        sub = event["data"]["object"]
        sub_id = sub.get("id")
        customer_id = sub.get("customer")
        user = await db.scalar(
            select(User).where(
                (User.stripe_subscription_id == sub_id)
                | (User.stripe_customer_id == customer_id)
            )
        )
        if user:
            if sub.get("status") in ("active", "trialing"):
                user.plan = Plan.pro.value
                user.stripe_subscription_id = sub_id
            else:
                user.plan = Plan.free.value
                user.stripe_subscription_id = None
            await db.commit()
            log.info("Subscription %s for user %s → plan=%s", sub_id, user.id, user.plan)

    return {"received": True}
