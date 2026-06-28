#!/usr/bin/env bash
# Bootstrap GenClear on Ubuntu home server.
# Run on the server: bash deploy/setup.sh
set -euo pipefail

DOMAIN="${DOMAIN:-genclear.net}"
SITE_URL="https://${DOMAIN}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/genclear}"
TLS_MODE="${TLS_MODE:-tunnel}"   # tunnel | direct

echo "==> GenClear deploy (domain: $DOMAIN, TLS: $TLS_MODE, dir: $INSTALL_DIR)"

# --- Docker ---
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME:-$VERSION}") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "    Added $USER to docker group — log out and back in if 'docker' permission denied."
fi

# --- Repo ---
if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  echo "==> Clone the repo into $INSTALL_DIR first, e.g.:"
  echo "    git clone <your-repo-url> $INSTALL_DIR"
  exit 1
fi
cd "$INSTALL_DIR"

# --- .env ---
if [[ ! -f .env ]]; then
  echo "==> Creating .env with random secrets..."
  SECRET_KEY=$(openssl rand -hex 32)
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  S3_SECRET_KEY=$(openssl rand -hex 16)

  cat >.env <<EOF
ENVIRONMENT=production
LOG_LEVEL=INFO
SECRET_KEY=${SECRET_KEY}
API_BASE_URL=${SITE_URL}
CORS_ORIGINS=${SITE_URL}
COOKIE_SECURE=true

POSTGRES_USER=genclear
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=genclear
DATABASE_URL=postgresql+asyncpg://genclear:${POSTGRES_PASSWORD}@db:5432/genclear
SYNC_DATABASE_URL=postgresql+psycopg2://genclear:${POSTGRES_PASSWORD}@db:5432/genclear

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

STORAGE_BACKEND=s3
DATA_DIR=/data
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=genclear
S3_SECRET_KEY=${S3_SECRET_KEY}
S3_BUCKET=genclear
S3_REGION=us-east-1
RESULT_TTL_HOURS=48
CACHE_TTL_HOURS=72
STUCK_JOB_GRACE_SEC=300

MAX_UPLOAD_BYTES=1073741824
MAX_DURATION_SEC=600
MAX_PENDING_JOBS_PER_USER=5
UPLOAD_RATE_LIMIT=20
LOGIN_RATE_LIMIT=10
REGISTER_RATE_LIMIT=5

TOOL_BIN=/opt/veo/GeminiWatermarkTool-Video
JOB_TIMEOUT_SEC=1800

FREE_CREDITS=3
MONTHLY_FREE_CREDITS=3
GUEST_JOBS_LIMIT=1
GUEST_RESULT_TTL_HOURS=24
PRO_RESULT_TTL_HOURS=1
FRONTEND_URL=${SITE_URL}

DOMAIN=${DOMAIN}
EOF
  echo "    Wrote .env — back it up somewhere safe."
else
  echo "==> .env already exists, skipping."
fi

# --- Caddy TLS mode ---
export DOMAIN
if [[ "$TLS_MODE" == "direct" ]]; then
  export CADDYFILE_PATH=./deploy/Caddyfile.production
  echo "==> Direct TLS: ensure router forwards TCP 80+443 to this host."
else
  export CADDYFILE_PATH=./Caddyfile
  echo "==> Tunnel mode: Caddy serves HTTP on :80; Cloudflare terminates HTTPS."
fi

# --- Build & start (production only — no dev override) ---
echo "==> Building and starting stack (first build downloads the watermark binary)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo ""
echo "==> Waiting for health checks..."
sleep 15
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

if curl -sf "http://localhost/healthz" >/dev/null; then
  echo "==> Local health check OK (http://localhost/healthz)"
else
  echo "==> Health check not ready yet — run: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api"
fi

# --- Cloudflare Tunnel (recommended for home servers) ---
if [[ "$TLS_MODE" == "tunnel" ]]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo ""
    echo "==> Install Cloudflare Tunnel to expose ${DOMAIN} without port forwarding:"
    echo "    curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null"
    echo "    echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main' | sudo tee /etc/apt/sources.list.d/cloudflared.list"
    echo "    sudo apt-get update && sudo apt-get install -y cloudflared"
    echo ""
    echo "    cloudflared tunnel login"
    echo "    cloudflared tunnel create genclear"
    echo "    # Edit deploy/cloudflared.yml with your tunnel UUID, then:"
    echo "    sudo cloudflared service install"
    echo "    sudo systemctl enable --now cloudflared"
  else
    echo ""
    echo "==> cloudflared is installed. Configure deploy/cloudflared.yml and run:"
    echo "    sudo cloudflared tunnel route dns genclear ${DOMAIN}"
    echo "    sudo cloudflared tunnel route dns genclear www.${DOMAIN}"
    echo "    sudo cp deploy/cloudflared.yml /etc/cloudflared/config.yml"
    echo "    sudo systemctl restart cloudflared"
  fi
fi

echo ""
echo "==> Done. Create an admin account:"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api python -m scripts.create_user you@${DOMAIN}"
