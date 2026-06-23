"""API keys, signed download tokens, webhook signing, and SSRF guards."""
import hashlib
import hmac
import ipaddress
import secrets
import socket
import string
from urllib.parse import urlparse

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import get_settings

settings = get_settings()
_serializer = URLSafeTimedSerializer(settings.secret_key, salt="download")


# --- API keys -------------------------------------------------------------
def generate_api_key() -> str:
    return "gck_" + secrets.token_urlsafe(32)


def generate_referral_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(7))


def hash_api_key(key: str) -> str:
    # API keys are high-entropy random tokens, so a fast hash is appropriate here
    # (unlike user passwords, which would need bcrypt/argon2).
    return hashlib.sha256(key.encode()).hexdigest()


# --- download tokens ------------------------------------------------------
def make_download_token(job_id) -> str:
    return _serializer.dumps(str(job_id))


def verify_download_token(token: str) -> str | None:
    try:
        return _serializer.loads(token, max_age=settings.download_token_max_age)
    except (BadSignature, SignatureExpired):
        return None


# --- webhooks -------------------------------------------------------------
def webhook_signature(body: bytes) -> str:
    return hmac.new(settings.secret_key.encode(), body, hashlib.sha256).hexdigest()


def is_safe_webhook_url(url: str) -> bool:
    """SSRF guard: https only, and the host must resolve to a public IP.

    Blocks loopback, private, link-local (incl. the cloud metadata address),
    multicast, reserved and unspecified ranges.
    """
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme != "https" or not parsed.hostname:
        return False
    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        return False
    for *_, sockaddr in infos:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            return False
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False
    return True
