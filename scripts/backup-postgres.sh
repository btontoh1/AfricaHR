#!/usr/bin/env bash
# Dumps the production Postgres database to a timestamped file and prunes
# backups older than RETENTION_DAYS. Run from the repo root (relies on
# docker-compose.prod.yml + .env.production being in the current directory,
# same as every other one-off production command in this repo).
#
# Usage: ./scripts/backup-postgres.sh
# Cron:  0 2 * * * cd /home/deploy/AfricaHR && ./scripts/backup-postgres.sh >> /home/deploy/pg-backups/backup.log 2>&1
#
# BACKUP_DIR defaults to a directory outside this git checkout, on purpose —
# a `git clean`/`reset --hard` mistake (or losing the checkout entirely)
# should never be able to take the backups down with it.
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="${BACKUP_DIR:-$HOME/pg-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [ ! -f "$ENV_FILE" ]; then
  echo "backup-postgres: $ENV_FILE not found — run this from the repo root (~/AfricaHR)." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "backup-postgres: POSTGRES_PASSWORD is not set in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/africahr-$TIMESTAMP.dump"
TMPFILE="$OUTFILE.partial"

echo "backup-postgres: starting dump -> $OUTFILE"

# -Fc: custom format — compressed, and restorable with pg_restore
# (including selective/parallel restore), unlike a plain .sql dump.
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  pg_dump -U africahr -d africahr -Fc > "$TMPFILE"

# A real dump is at minimum a few KB even for an empty schema — this catches
# the case where pg_dump silently produced an empty/near-empty file without
# actually failing the command (e.g. a connection that dropped mid-stream).
MIN_BYTES=2048
ACTUAL_BYTES=$(wc -c < "$TMPFILE")
if [ "$ACTUAL_BYTES" -lt "$MIN_BYTES" ]; then
  echo "backup-postgres: dump only ${ACTUAL_BYTES} bytes (expected at least ${MIN_BYTES}) — treating as failed, not keeping it." >&2
  rm -f "$TMPFILE"
  exit 1
fi

mv "$TMPFILE" "$OUTFILE"
echo "backup-postgres: wrote $(wc -c < "$OUTFILE") bytes to $OUTFILE"

# Only prune once a new backup has succeeded — a failed run above exits
# before reaching here, so a bad day never empties the retention window.
DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -name 'africahr-*.dump' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
echo "backup-postgres: pruned $DELETED backup(s) older than $RETENTION_DAYS days"

echo "backup-postgres: done"
