# GenClear — Watermark Removal Service

A production-ready watermark removal platform wrapping the [VeoWatermarkRemover](https://github.com/allenk/VeoWatermarkRemover)
CLI (`v0.6.4-demo`). Users upload Veo/Gemini clips, jobs are queued via Celery, processed one at a time,
and results are delivered through a modern Next.js UI, signed download links, or webhooks.

Built for a single low-power box (Intel N95, 4 cores, no usable GPU), so work is serialized:
**one worker, one clip at a time.**

## Architecture

```
Browser ──▶ Caddy (TLS, routing) ──┬──▶ Next.js (web)     landing, auth, dashboard
                                    ├──▶ FastAPI (api)     /api/*, /v1/*
                                    └──▶ PostgreSQL, Redis, MinIO
                                              │
                         Celery worker ×1 ◀───┘
                         └─▶ Veo binary + ffmpeg ─▶ MinIO (S3) + local scratch
```

| Service | Role |
|---|---|
| `caddy` | Reverse proxy, TLS, 1 GB upload cap. Routes API traffic to FastAPI, everything else to Next.js. |
| `web` | **Next.js 15** frontend — upload UI, live progress, account management. |
| `api` | **FastAPI** — validate uploads, enqueue jobs, stream results, deliver webhooks. |
| `worker` | **Celery** (`--concurrency=1 -B`) — runs the SHA-pinned binary; **no internet egress**. |
| `minio` | **S3-compatible** object storage for uploads, results, and the content cache. |
| `db` | PostgreSQL 16 — job + user metadata. |
| `redis` | Celery broker + live-progress pub/sub. |

### Tech stack

| Layer | Choice |
|---|---|
| Backend API | FastAPI (Python 3.12) |
| Queue | Celery 5 + Redis 7 |
| Frontend | Next.js 15 (App Router, TypeScript) |
| Storage | MinIO (S3-compatible) via boto3 |
| Database | PostgreSQL 16 |

## Quick start

```bash
cp .env.example .env          # edit SECRET_KEY, POSTGRES_PASSWORD, S3_SECRET_KEY
docker compose up -d --build  # first build downloads + SHA256-verifies the binary
```

`docker compose` automatically merges `docker-compose.override.yml`, which runs the
Next.js **dev server** with your `frontend/` folder mounted — edits reload on
`http://localhost/` without rebuilding the image. On Windows, file watching uses
polling so changes are picked up reliably through Docker volumes.

For a production-style frontend build (no hot reload), omit the override file:

```bash
docker compose -f docker-compose.yml up -d --build
```

For the live box, set `ENVIRONMENT=production` in `.env`. In production the API
**refuses to start** with the default `SECRET_KEY` and disables the interactive
`/docs` (override with `ENABLE_DOCS=true`). All services expose Docker
healthchecks, and Caddy waits for `api`/`web` to report healthy before serving.

Open `http://localhost/`, click **Get started**, and register — every new account
gets **3 free videos**.

Provision an unlimited Pro / API-only account:

```bash
docker compose exec api python -m scripts.create_user you@example.com
```

### Local development (without Docker)

```bash
# Terminal 1 — API
pip install -r requirements.txt
STORAGE_BACKEND=local DATA_DIR=./data uvicorn app.main:app --reload --port 8000

# Terminal 2 — worker
celery -A app.celery_app worker -B --concurrency=1 --loglevel=info

# Terminal 3 — frontend
cd frontend && npm install && npm run dev
```

Set `CORS_ORIGINS=http://localhost:3000` in `.env`. The Next.js dev server proxies API calls
to the same origin when behind Caddy; for pure local dev, API requests go to `http://localhost:8000`
via the browser through Caddy or configure a Next.js rewrite.

## Accounts, sessions & the free trial

- **Web users** sign up with email + password; session is a signed httpOnly cookie.
  **API users** authenticate with `Authorization: Bearer gck_...` keys from the Account page.
- **Free trial = credits.** New accounts start with `FREE_CREDITS` (default 3).
  Each video spends one credit; the worker **refunds** on failure or skip. Pro is unlimited.
- Pages: `/` · `/login` · `/register` · `/app` · `/account`

## API (programmatic)

```bash
curl -F file=@clip.mp4 -H "Authorization: Bearer gck_..." http://localhost/v1/jobs
curl -H "Authorization: Bearer gck_..." http://localhost/v1/jobs/<id>
curl -L -o out.mp4 "http://localhost/v1/jobs/<id>/download?token=..."
```

Live progress: `WS /v1/jobs/<id>/events`. Webhooks: pass `webhook_url` on upload.

## Storage

Uploads, processed outputs, and the SHA-256 content cache live in MinIO (`STORAGE_BACKEND=s3`).
The worker downloads to `/data/scratch`, processes locally, then uploads results back.

For local dev without MinIO, set `STORAGE_BACKEND=local` — files go under `DATA_DIR`.

## Security notes

- Worker container has **no internet egress** (internal `backend` network only).
- Upload validation: libmagic MIME sniff + ffprobe structural checks before queueing.
- Download URLs are signed, expiring tokens — no session required to fetch results.
- Webhook URLs must be public HTTPS; SSRF guards block private IPs.

## Payments

The "Upgrade to Pro" button is a stub. Wire Stripe Checkout to flip `users.plan` to `pro`
on webhook success when you're ready.
