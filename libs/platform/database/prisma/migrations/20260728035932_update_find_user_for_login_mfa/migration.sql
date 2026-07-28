-- AuthService.authenticate() needs to know mfaEnabled to decide whether to
-- issue real tokens or an MFA challenge - widening find_user_for_login's
-- narrow column allowlist by one field, per RLS_CONVENTION.md §5. Postgres
-- refuses CREATE OR REPLACE when a RETURNS TABLE column list changes
-- ("cannot change return type of existing function"), so this must drop
-- and recreate - same name, same SECURITY DEFINER owner, re-granted below.
DROP FUNCTION find_user_for_login(TEXT);

CREATE FUNCTION find_user_for_login(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  email TEXT,
  "passwordHash" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  role "SystemRole",
  "isActive" BOOLEAN,
  "mfaEnabled" BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, email, password_hash, first_name, last_name, role, is_active, mfa_enabled
  FROM users
  WHERE email = p_email AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_user_for_login(TEXT) TO africahr_app;
