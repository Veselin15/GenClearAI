"""Enable a user account (or delete and let them re-register).

    docker compose exec api python -m scripts.enable_user veselinveselinov06@gmail.com
    docker compose exec api python -m scripts.enable_user veselinveselinov06@gmail.com --delete
"""
import argparse
import sys

from app.db import SyncSessionLocal
from app.models import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Enable or remove a user by email")
    parser.add_argument("email", help="user email address")
    parser.add_argument(
        "--delete",
        action="store_true",
        help="delete the user instead (fresh signup on next Google login)",
    )
    args = parser.parse_args()
    email = args.email.strip().lower()
    if not email:
        sys.exit("email is required")

    with SyncSessionLocal() as session:
        user = session.query(User).filter(User.email == email).first()
        if user is None:
            sys.exit(f"no user found for {email}")

        if args.delete:
            session.delete(user)
            session.commit()
            print(f"deleted user {email}")
            return

        user.is_active = True
        session.commit()
        print(f"enabled user {email} (id={user.id}, is_active=True)")


if __name__ == "__main__":
    main()
