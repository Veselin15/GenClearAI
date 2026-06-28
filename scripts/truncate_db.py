"""Wipe all application data from PostgreSQL (users, jobs, job events).

    docker compose exec api python -m scripts.truncate_db --yes

Does not touch MinIO uploads or Redis — only the Postgres tables.
"""
import argparse
import sys

from sqlalchemy import text

from app.db import sync_engine


def main() -> None:
    parser = argparse.ArgumentParser(description="Truncate GenClear database tables")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="required — confirms you want to delete all users and jobs",
    )
    args = parser.parse_args()
    if not args.yes:
        sys.exit("Refusing to run without --yes (this deletes ALL users and jobs)")

    with sync_engine.begin() as conn:
        conn.execute(
            text("TRUNCATE TABLE job_events, jobs, users RESTART IDENTITY CASCADE")
        )
    print("Truncated: job_events, jobs, users")


if __name__ == "__main__":
    main()
