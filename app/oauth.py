"""Shared Google OAuth client (Authlib)."""
from authlib.integrations.starlette_client import OAuth

from .config import get_settings

settings = get_settings()
oauth = OAuth()

if settings.google_client_id:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
