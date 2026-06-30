#!/usr/bin/env bash
# =============================================================================
# init-letsencrypt.sh – Bootstrap Let's Encrypt SSL certificates for 4uTest
#
# Run ONCE before the first full deploy, from the deploy/ directory:
#   cd /path/to/4uTest/deploy
#   ./scripts/init-letsencrypt.sh
#
# Prerequisites:
#   • DOMAIN and CERTBOT_EMAIL must be set in deploy/.env
#   • Port 80 must be publicly reachable from the internet
#   • DNS A record must already point to this server's IP
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$DEPLOY_DIR"

# ── Colour helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
step()    { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── Preflight ───────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1    || error "docker is not installed"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" version >/dev/null 2>&1 || error "docker compose -f "$DEPLOY_DIR/docker-compose.yml" v2 plugin is not installed"
[[ -f "$DEPLOY_DIR/.env" ]]          || error ".env not found – copy .env.example to .env first"

info "Loading environment..."
set -a; source "$DEPLOY_DIR/.env"; set +a

DOMAIN="${DOMAIN:?DOMAIN must be set in .env}"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL must be set in .env}"
STAGING="${STAGING:-0}"   # set STAGING=1 in .env for a dry-run (no rate-limit)

RSA_KEY_SIZE=4096
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"

info "Domain : $DOMAIN"
info "Email  : $EMAIL"
[[ "$STAGING" == "1" ]] && warning "STAGING=1 – using Let's Encrypt staging server (no browser trust)"

# ── Check existing cert ──────────────────────────────────────────────────────
if docker compose -f "$DEPLOY_DIR/docker-compose.yml" run --rm --entrypoint "" certbot \
       test -f "${CERT_PATH}/fullchain.pem" 2>/dev/null; then
  read -rp "A certificate already exists for $DOMAIN. Replace it? [y/N] " ANSWER
  [[ "$ANSWER" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
fi

# ── Ensure recommended TLS files exist in the volume ────────────────────────
step "Downloading recommended TLS parameters"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" run --rm --entrypoint "/bin/sh -c '\
  if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then \
    wget -q -O /etc/letsencrypt/options-ssl-nginx.conf \
      https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf; \
  fi; \
  if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then \
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048; \
  fi'" certbot

# ── Create dummy self-signed certificate so Nginx can start ─────────────────
step "Creating temporary self-signed certificate"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" run --rm --entrypoint "/bin/sh -c '\
  mkdir -p ${CERT_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ${CERT_PATH}/privkey.pem \
    -out    ${CERT_PATH}/fullchain.pem \
    -subj   /CN=localhost'" certbot

# ── Start Nginx (uses the dummy cert) ───────────────────────────────────────
step "Starting Nginx with temporary certificate"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d nginx mysql redis

info "Waiting 5 s for Nginx to be ready..."
sleep 5

# ── Remove dummy cert and obtain real one ───────────────────────────────────
step "Deleting temporary certificate"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" run --rm --entrypoint "/bin/sh -c '\
  rm -rf ${CERT_PATH} \
         /etc/letsencrypt/archive/${DOMAIN} \
         /etc/letsencrypt/renewal/${DOMAIN}.conf'" certbot

step "Requesting certificate from Let's Encrypt"
STAGING_ARG=""
[[ "$STAGING" == "1" ]] && STAGING_ARG="--staging"

docker compose -f "$DEPLOY_DIR/docker-compose.yml" run --rm --entrypoint "/bin/sh -c '\
  certbot certonly --webroot -w /var/www/certbot \
    ${STAGING_ARG} \
    -d ${DOMAIN} \
    --email ${EMAIL} \
    --rsa-key-size ${RSA_KEY_SIZE} \
    --agree-tos \
    --no-eff-email \
    --force-renewal'" certbot

# ── Reload Nginx with the real certificate ───────────────────────────────────
step "Reloading Nginx"
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec nginx nginx -s reload

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Let's Encrypt certificate issued successfully!          ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  Next step: run ./scripts/deploy.sh for a full deploy.  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
