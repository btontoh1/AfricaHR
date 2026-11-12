#!/usr/bin/env bash
# Pulls latest main, rebuilds, and restarts the production stack - the one
# command that should ever be used to deploy, instead of typing out
# `docker compose ... up -d --build` by hand.
#
# Exists because of a real incident: a bare `docker compose up -d --build`
# run without --env-file left every secret (DB password, JWT keys, Redis
# password, ...) blank, which crash-looped Redis and took web/api/caddy
# down with it. Separately, a second deploy was kicked off in another
# terminal before the first had finished, and it finished later, silently
# re-breaking the fix mid-recovery. This script closes both holes: the env
# file is always passed, and a lock file means a second concurrent run
# refuses to start instead of racing the first.
#
# Usage: ./scripts/deploy.sh
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
LOCK_FILE="${DEPLOY_LOCK_FILE:-$HOME/.africahr-deploy.lock}"

if [ ! -f "$ENV_FILE" ]; then
  echo "deploy: $ENV_FILE not found — run this from the repo root (~/AfricaHR)." >&2
  exit 1
fi

# Held for the lifetime of this script (fd 200 stays open until exit) -
# a second ./scripts/deploy.sh started while this one is running sees the
# lock taken and refuses to start, rather than both racing to recreate the
# same containers.
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "deploy: another deploy is already running (lock: $LOCK_FILE) — refusing to start a second one." >&2
  echo "deploy: if you're sure nothing else is actually running, remove the lock file and retry." >&2
  exit 1
fi

echo "deploy: $(date -Iseconds) - starting"

BEFORE_COMMIT=$(git rev-parse --short HEAD)
git pull origin main
AFTER_COMMIT=$(git rev-parse --short HEAD)
echo "deploy: $BEFORE_COMMIT -> $AFTER_COMMIT"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# Give containers a moment to settle (healthchecks, startup) before judging
# them - checking immediately after `up -d` returns would catch postgres/
# redis mid-healthcheck and report a false failure.
echo "deploy: waiting for containers to settle..."
sleep 20

FAILED=0
for service in postgres redis api web caddy; do
  container="africahr-${service}-1"
  status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "missing")
  if [ "$status" != "running" ]; then
    echo "deploy: FAILED - container $container is '$status', expected 'running'" >&2
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=30 "$service" >&2 || true
    FAILED=1
  else
    echo "deploy: ok - $container is running"
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo "deploy: $(date -Iseconds) - FAILED, see container logs above" >&2
  exit 1
fi

echo "deploy: $(date -Iseconds) - done, now running $AFTER_COMMIT"
