#!/usr/bin/env bash
# Reclaims disk space from Docker images and build cache left behind by
# repeated `docker compose build` deploys - every rebuild leaves the
# previous image version dangling, and BuildKit's cache grows unbounded
# otherwise. Safe to run any time: `docker image prune -a` only removes
# images with no container using them, so it never touches what's
# currently running.
#
# Usage: ./scripts/docker-cleanup.sh
# Cron:  0 3 * * 0 cd /home/deploy/AfricaHR && ./scripts/docker-cleanup.sh >> /home/deploy/docker-cleanup.log 2>&1
set -euo pipefail

echo "docker-cleanup: $(date -Iseconds) - before:"
df -h / | tail -1

docker image prune -a -f
# Only cache older than a day, so a same-day deploy's cache isn't wiped
# out from under it by a cleanup that happens to run right after.
docker builder prune -a -f --filter until=24h

echo "docker-cleanup: $(date -Iseconds) - after:"
df -h / | tail -1
echo "docker-cleanup: done"
