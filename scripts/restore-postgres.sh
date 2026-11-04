#!/usr/bin/env bash
# Restores a backup produced by backup-postgres.sh into the running
# postgres container. Destructive by nature (drops and recreates every
# object in the target database), so it refuses to run without an
# explicit --yes and prints exactly what it's about to do first.
#
# Usage:
#   ./scripts/restore-postgres.sh --list                     # show available backups
#   ./scripts/restore-postgres.sh /path/to/africahr-*.dump --yes
#
# Restoring into a *different* database for a dry run/verification pass,
# rather than straight into the live "africahr" database, is strongly
# recommended before trusting a restore procedure in production - pass
# --target-db to restore into an alternate database name instead.
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="${BACKUP_DIR:-$HOME/pg-backups}"
TARGET_DB="africahr"
CONFIRMED="false"
DUMP_FILE=""

usage() {
  cat >&2 <<EOF
Usage:
  $0 --list
  $0 <dump-file> --yes [--target-db NAME]

  --list              List available backups in $BACKUP_DIR and exit.
  --yes               Required to actually run a restore (safety gate).
  --target-db NAME     Restore into this database instead of "africahr"
                       (must already exist - create it first with
                       'docker compose ... exec postgres createdb -U africahr NAME').
                       Use this to verify a backup restores cleanly
                       without touching the live database.
EOF
  exit 1
}

if [ ! -f "$ENV_FILE" ]; then
  echo "restore-postgres: $ENV_FILE not found — run this from the repo root (~/AfricaHR)." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

[ $# -eq 0 ] && usage

if [ "$1" = "--list" ]; then
  echo "Backups in $BACKUP_DIR:"
  ls -lh "$BACKUP_DIR"/africahr-*.dump 2>/dev/null || echo "  (none found)"
  exit 0
fi

DUMP_FILE="$1"
shift
while [ $# -gt 0 ]; do
  case "$1" in
    --yes) CONFIRMED="true"; shift ;;
    --target-db) TARGET_DB="$2"; shift 2 ;;
    *) echo "restore-postgres: unknown argument '$1'" >&2; usage ;;
  esac
done

if [ ! -f "$DUMP_FILE" ]; then
  echo "restore-postgres: dump file not found: $DUMP_FILE" >&2
  exit 1
fi

if [ "$CONFIRMED" != "true" ]; then
  echo "restore-postgres: this will DROP and recreate every object in database \"$TARGET_DB\" from $DUMP_FILE."
  echo "restore-postgres: re-run with --yes to actually do this. Refusing to proceed."
  exit 1
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "restore-postgres: POSTGRES_PASSWORD is not set in $ENV_FILE" >&2
  exit 1
fi

echo "restore-postgres: restoring $DUMP_FILE into database \"$TARGET_DB\" ..."

# --clean --if-exists: drop existing objects first so this is safe to run
# against a database that already has (possibly stale) data in it, not
# just an empty one. -Fc dumps need pg_restore, not psql.
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  pg_restore -U africahr -d "$TARGET_DB" --clean --if-exists --no-owner < "$DUMP_FILE"

echo "restore-postgres: done. Verify the application against \"$TARGET_DB\" before treating this as a completed recovery."
