#!/usr/bin/env bash
set -e

# Surokkha Cloudflare R2 Daily Backup Runner (Database + Uploads)
# Target Bucket: surokkha
# Daily Schedule: 03:00 AM (Asia/Dhaka)

export R2_ACCOUNT_ID="fa0942a4bd8e442e22f78fdb6a2a605a"
export R2_ACCESS_KEY_ID="0fbd22ecac4786634ff398fbe388991d"
export R2_SECRET_ACCESS_KEY="e71e7f8fbf0aa122dc6ed476eb67d74eec2eeaebb44274417a50daa20ca489d4"
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
