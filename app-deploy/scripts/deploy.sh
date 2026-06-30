#!/usr/bin/env bash
# =============================================================================
# deploy.sh – Full production deployment for 4uTest
#
# Run from the deploy/ directory:
#   cd /path/to/4uTest/deploy
#   ./scripts/deploy.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"

cd "$DEPLOY_DIR"

# ── Colour helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Preflight checks ────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "docker is not installed"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" version >/dev/null 2>&1 || error "docker compose -f "$DEPLOY_DIR/docker-compose.yml" v2 plugin is not installed"

[[ -f "$DEPLOY_DIR/.env" ]] || error ".env not found in deploy/ – copy .env.example to .env and fill it in"

info "Loading environment from $DEPLOY_DIR/.env"
set -a; source "$DEPLOY_DIR/.env"; set +a

[[ "${DOMAIN:-}" ]] || error "DOMAIN is not set in .env"
[[ "${APP_KEY:-}" != *REPLACE_ME* ]] || error "APP_KEY is still the placeholder. Run: php artisan key:generate --show"

# ── Pull latest code ────────────────────────────────────────────────────────
info "Pulling latest code from git..."
cd "$APP_DIR"
git pull --rebase
cd "$DEPLOY_DIR"

# ── Build Docker images ─────────────────────────────────────────────────────
info "Building Docker images (backend + frontend)..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" build --no-cache php-fpm nginx

# ── Start infrastructure (DB + Redis) first ─────────────────────────────────
info "Starting MySQL and Redis..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d mysql redis

info "Waiting for MySQL to be healthy (up to 60 s)..."
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"
export COMPOSE_FILE
timeout 60 bash -c \
  'until docker compose -f "$COMPOSE_FILE" ps mysql 2>/dev/null | grep -q "(healthy)"; do sleep 2; done' \
  || error "MySQL did not become healthy in time"

# ── Start PHP-FPM ───────────────────────────────────────────────────────────
info "Starting php-fpm..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d php-fpm

info "Waiting for php-fpm to be healthy (up to 60 s)..."
timeout 60 bash -c \
  "until docker compose -f \"$DEPLOY_DIR/docker-compose.yml\" ps php-fpm 2>/dev/null | grep -q 'healthy'; do sleep 3; done" \
  || warning "php-fpm health check not yet passing (continuing anyway)"

# ── Database migrations ──────────────────────────────────────────────────────
info "Running database migrations..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan migrate --force

# ── Seed default admin (only on first deploy) ────────────────────────────────
if docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan tinker --execute="echo \App\Models\User::where('is_admin', true)->count();" 2>/dev/null | grep -q "^0$"; then
  info "No admin users found – running database seeder..."
  docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan db:seed --force 2>/dev/null || true
fi

# ── Cache Laravel config / routes / views ───────────────────────────────────
info "Caching Laravel application..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan config:cache
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan route:cache
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan view:cache
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec php-fpm php artisan storage:link 2>/dev/null || true

# ── Start remaining services ─────────────────────────────────────────────────
info "Starting nginx, horizon, scheduler and certbot..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d

info "Reloading nginx config..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec nginx nginx -s reload 2>/dev/null || true

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   4uTest deployed successfully!              ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   URL:     https://${DOMAIN}   ${NC}"
echo -e "${GREEN}║   Horizon: https://${DOMAIN}/horizon ${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "Service status:"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps
