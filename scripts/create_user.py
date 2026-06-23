"""Create a user and print a fresh API key.

    docker compose exec api python -m scripts.create_user you@example.com

The raw key is shown once and only its hash is stored.
"""
import sys

from app.db import SyncSessionLocal, sync_engine
from app.models import Base, User
from app.security import generate_api_key, hash_api_key


def main() -> None:
    email = sys.argv[1] if len(sys.argv) > 1 else input("email: ").strip()
    if not email:
        sys.exit("an email is required")

    Base.metadata.create_all(sync_engine)
    key = generate_api_key()
    with SyncSessionLocal() as session:
        if session.query(User).filter(User.email == email).first():
            sys.exit(f"user {email} already exists")
        # admin/API account: Pro plan (unlimited), no password (API key only)
        user = User(email=email, api_key_hash=hash_api_key(key), plan="pro")
        session.add(user)
        session.commit()
        print(f"user_id = {user.id}")

    print(f"API key (store it now — it is not recoverable):\n  {key}")


if __name__ == "__main__":
    main()
