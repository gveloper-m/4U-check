#!/usr/bin/env bash
# =============================================================================
# backup-db.sh – Daily MySQL backup with 7-day local rotation
#
# Installed automatically by deploy.sh into /etc/cron.daily/4utest-backup
# Runs every day at ~03:00 (cron.daily timing).
# Backups stored in /opt/4utest-backups/, kept for 7 days.
# =============================================================================

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="/opt/4utest-backups"
KEEP_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "Starting database backup..."

# Load env to get DB credentials
set -a
source "$DEPLOY_DIR/.env"
set +a

# Run mysqldump inside the MySQL container and gzip on the fly
if docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec -T mysql \
    mysqldump -u root -p"${DB_ROOT_PASSWORD}" \
    --single-transaction --quick --lock-tables=false \
    "${DB_DATABASE}" \
  | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    log "Backup OK → $BACKUP_FILE ($SIZE)"
else
    log "ERROR: Backup FAILED"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Rotate — delete backups older than KEEP_DAYS
DELETED=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +"$KEEP_DAYS" -print -delete | wc -l)
[[ "$DELETED" -gt 0 ]] && log "Rotated $DELETED old backup(s)"

log "Done. Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | awk '{print "  "$NF, $5}' | tee -a "$LOG_FILE"
