-- A platform-wide broadcast (e.g. "the Terms of Service changed") needs one
-- TENANT_ADMIN per active tenant, across every tenant at once - the same
-- genuinely-cross-tenant shape as find_organizations_pending_review(),
-- and "users" has the nullable-tenant §4 RLS policy (not §2's plain one),
-- but that only gives withPlatformScope visibility into tenant_id IS NULL
-- rows (platform admins themselves) - a real tenant's User rows still have
-- a non-null tenant_id and stay invisible to the sentinel. This needs the
-- same §5 SECURITY DEFINER escape hatch as find_user_for_login().
--
-- DISTINCT ON (tenant_id) ... ORDER BY tenant_id, created_at picks the
-- longest-standing TENANT_ADMIN per tenant - stable across repeated calls
-- (no "most recently created admin" drift if a second admin is added
-- later), and the one most likely to actually be the primary contact.
CREATE FUNCTION find_active_tenant_admins()
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  email TEXT,
  "firstName" TEXT,
  "lastName" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (u.tenant_id) u.id, u.tenant_id, u.email, u.first_name, u.last_name
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  WHERE u.role = 'TENANT_ADMIN'
    AND u.is_active
    AND u.deleted_at IS NULL
    -- Anyone still bound by the Terms, not just fully ACTIVE billing status -
    -- a TRIAL tenant agreed to the same Terms the moment they signed up (see
    -- the Terms' own "by creating an account... you agree" framing), and a
    -- SUSPENDED tenant (e.g. for non-payment) hasn't left the agreement
    -- either. Only CLOSED is excluded.
    AND t.status != 'CLOSED'
    AND t.deleted_at IS NULL
  ORDER BY u.tenant_id, u.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION find_active_tenant_admins() TO africahr_app;
