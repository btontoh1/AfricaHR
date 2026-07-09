#!/bin/sh
# Creates the least-privilege runtime role the app connects as (APP_DATABASE_URL).
# $POSTGRES_USER stays superuser/table-owner and is used only for migrations
# (DATABASE_URL) — see RLS_CONVENTION.md for why the split matters: superusers
# and table owners unconditionally bypass Row-Level Security.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE africahr_app LOGIN PASSWORD '$APP_DB_PASSWORD';
  GRANT USAGE ON SCHEMA public TO africahr_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO africahr_app;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO africahr_app;
  ALTER DEFAULT PRIVILEGES FOR ROLE $POSTGRES_USER IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO africahr_app;
  ALTER DEFAULT PRIVILEGES FOR ROLE $POSTGRES_USER IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO africahr_app;
EOSQL
