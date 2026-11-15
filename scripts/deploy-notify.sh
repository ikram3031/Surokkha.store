#!/usr/bin/env bash
# Runs at the end of `make deploy` on the VPS: records this deploy's version in Plexivia,
# so every project's running version is kept in one place. Plexivia adds 1 to minor
# (rolls into major after 99), keeps the history and sends the dashboard notification.
# The key in the URL is Surokkha's own deploy key (Plexivia checks it, it only bumps SUROKKHA). No .env needed.
# Never fails the deploy.
set -u
cd "$(dirname "$0")/.."

URL='https://api.plexivia.com/api/deploy/bump?key=14918023caad1e9c48344b0e42d9987af40b6cad339cf500bd7813ed43e8db3d'

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

COMMIT="$(json_escape "$(git log -1 --format='%h %s' 2>/dev/null)")"
BRANCH="$(json_escape "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)")"
HOST="$(json_escape "$(hostname)")"
BODY="{\"name\":\"Surokkha\",\"commit\":\"$COMMIT\",\"branch\":\"$BRANCH\",\"host\":\"$HOST\"}"

# A few quiet tries in case of a network blip
for _ in 1 2 3; do
  if OUT="$(curl -fsS --max-time 15 -X POST "$URL" -H 'Content-Type: application/json' -d "$BODY" 2>/dev/null)"; then
    echo "🏷️  $OUT"
    exit 0
  fi
  sleep 3
done
echo "⚠️  Could not record the deploy version in Plexivia"
exit 0
