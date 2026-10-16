#!/usr/bin/env bash
set -e

# Surokkha Cloudflare R2 Daily Backup Runner (Database + Uploads)
# Target Bucket: surokkha
# Daily Schedule: 03:00 AM (Asia/Dhaka)

export R2_ACCOUNT_ID="${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID in .env}"
export R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:?set R2_ACCESS_KEY_ID in .env}"
export R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:?set R2_SECRET_ACCESS_KEY in .env}"
export R2_BUCKET_NAME="surokkha"
export MONGODB_CONTAINER_NAME="surokkha-mongodb-live"
export MONGODB_DB_NAME="surokkha-db"
export R2_BACKUP_RETENTION_DAYS="30"

APP_DIR="/opt/clients/surokkha"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$APP_DIR"

LOCK_FILE="/var/run/surokkha-r2-backup.lock"
exec 200>"$LOCK_FILE"
flock -n 200 || {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Another backup process is already running. Exiting."
  exit 0
}

echo "========================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Surokkha R2 Daily Backup"
echo "========================================================"

NODE_PATH="$APP_DIR/backend/node_modules:$APP_DIR/node_modules" node "$APP_DIR/scripts/backup-to-r2.js"

echo "========================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Surokkha R2 Daily Backup Completed"
echo "========================================================"
