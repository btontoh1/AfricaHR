-- Refresh/logout must resolve a refresh token from its hash alone, before
-- the caller's tenant is known (the hash doesn't reveal it) — same shape of
-- problem as login (see 20260709225824_add_login_lookup_function). The app
-- connects as africahr_app, a least-privilege, non-superuser role; under
-- RLS's nullable-tenant policy on "refresh_tokens" (RLS_CONVENTION.md §4),
-- an unscoped SELECT only ever returns platform-admin rows (tenant_id IS
-- NULL) — every tenant-scoped refresh token is invisible to a plain query
-- with no tenant context set, and worse, on a pooled connection a stale GUC
-- left over from an earlier tenant-scoped query on the same connection can
-- make the lookup succeed or fail unpredictably depending on connection
-- reuse (see tenant-scoped.ts withScope's doc comment).
--
-- This function is owned by the migration/owner role (africahr, superuser)
-- and marked SECURITY DEFINER, so it runs with the owner's RLS-bypassing
-- privileges regardless of caller — a narrow, auditable exception scoped to
-- exactly the columns refresh/logout need, rather than granting
-- africahr_app a general RLS bypass. Column aliases are camelCase to match
-- Prisma's $queryRaw result mapping in RefreshTokenRepository.findByTokenHash.
CREATE FUNCTION find_refresh_token_by_hash(p_token_hash TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "userId" TEXT,
  "expiresAt" TIMESTAMP(3)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, user_id, expires_at
  FROM refresh_tokens
  WHERE token_hash = p_token_hash AND revoked_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_refresh_token_by_hash(TEXT) TO africahr_app;
