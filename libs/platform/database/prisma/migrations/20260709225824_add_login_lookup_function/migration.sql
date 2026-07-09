-- Login must resolve a user from email alone, before any tenant context is
-- known (email is globally unique across tenants — see project memory).
-- The app connects as africahr_app, a least-privilege, non-superuser role
-- (see the 2026-07-09 RLS-bypass fix); under RLS's nullable-tenant policy
-- on "users" (RLS_CONVENTION.md §4), an unscoped SELECT only ever returns
-- platform-admin rows (tenant_id IS NULL) — every tenant-scoped user is
-- invisible to a plain query with no tenant context set.
--
-- This function is owned by the migration/owner role (africahr, superuser)
-- and marked SECURITY DEFINER, so it runs with the owner's RLS-bypassing
-- privileges regardless of caller — a narrow, auditable exception scoped to
-- exactly the columns login needs, rather than granting africahr_app a
-- general RLS bypass. Column aliases are camelCase to match Prisma's
-- $queryRaw result mapping in UserRepository.findByEmail.
CREATE FUNCTION find_user_for_login(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  email TEXT,
  "passwordHash" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  role "SystemRole",
  "isActive" BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, email, password_hash, first_name, last_name, role, is_active
  FROM users
  WHERE email = p_email AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_user_for_login(TEXT) TO africahr_app;
