#!/usr/bin/env bash
# Runs at the end of `make deploy` on the VPS: records the deploy version (minor +1, rolls into major
# after 99) through the dashboard API, which also posts a bell notification and a deploy report into
# the Webmail inbox. Needs DEPLOY_HOOK_TOKEN in backend/.env (the dashboard API reads the same value).
# Never fails the deploy.
set -u
cd "$(dirname "$0")/.."

TOKEN="$(grep -E '^DEPLOY_HOOK_TOKEN=' backend/.env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"' \r")"
if [ -z "$TOKEN" ]; then
  echo "ℹ️  DEPLOY_HOOK_TOKEN not set in backend/.env, deploy version not recorded"
  exit 0
fi

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

COMMIT="$(json_escape "$(git log -1 --format='%h %s' 2>/dev/null)")"
BRANCH="$(json_escape "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)")"
HOST="$(json_escape "$(hostname)")"
# The very first deploy counts on from the repo's root package.json version
SEED="$(node -p "require('./package.json').version" 2>/dev/null || echo 1.0.0)"
BODY="{\"target\":\"SUROKKHA\",\"commit\":\"$COMMIT\",\"branch\":\"$BRANCH\",\"host\":\"$HOST\",\"seedVersion\":\"$SEED\"}"

# The dashboard API was just restarted, so give it a few tries
for _ in 1 2 3 4 5 6; do
  if OUT="$(curl -fsS -X POST http://127.0.0.1:5096/api/v2/deploy/bump \
      -H 'Content-Type: application/json' -H "X-Deploy-Token: $TOKEN" -d "$BODY")"; then
    echo "🏷️  $OUT"
    exit 0
  fi
  sleep 3
done
echo "⚠️  Could not record the deploy version (dashboard API on 5096 not answering)"
exit 0
