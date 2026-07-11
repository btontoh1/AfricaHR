-- Fixes a real, reproducible bug: the platform-admin (tenant_id IS NULL)
-- half of these three tables' RLS policies relied on
-- current_setting('app.current_tenant_id', true) IS NULL to identify an
-- unscoped (platform-admin) request. On a real Postgres connection, once a
-- custom GUC has been SET even once in a session's lifetime, it can never
-- be made to return NULL again from current_setting(name, true) - not via
-- RESET, not via set_config(name, NULL, is_local). Both just revert it to
-- an empty string / the session-level value, never back to true "never
-- touched" NULL. On a pooled connection reused across many requests (the
-- app's normal operating mode), this meant a platform-admin query landing
-- on any connection that had EVER previously served a tenant-scoped query
-- would have its own row silently filtered out by RLS - reproduced as a
-- deterministic PrismaClientKnownRequestError P2025 on concurrent
-- platform-admin logins. See PrismaService.withPlatformScope.
--
-- Fixed by comparing against an explicit sentinel string instead of
-- relying on NULL/"never touched" state, which is deterministic regardless
-- of a connection's prior history.
DROP POLICY tenant_isolation ON "users";
CREATE POLICY tenant_isolation ON "users"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );

DROP POLICY tenant_isolation ON "refresh_tokens";
CREATE POLICY tenant_isolation ON "refresh_tokens"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );

DROP POLICY tenant_isolation ON "audit_logs";
CREATE POLICY tenant_isolation ON "audit_logs"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );
