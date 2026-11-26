-- AuthService needs organizationUnitId at the pre-tenant-context login
-- lookup so it can embed it in the JWT for UNIT_ADMIN users, same reasoning
-- as 20260810170700_update_find_user_for_login_organization_id. Postgres
-- refuses CREATE OR REPLACE when a RETURNS TABLE column list changes, so
-- this must drop and recreate - same name, same SECURITY DEFINER owner,
-- re-granted below.
DROP FUNCTION find_user_for_login(TEXT);

CREATE FUNCTION find_user_for_login(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "organizationId" TEXT,
  "organizationUnitId" TEXT,
  email TEXT,
  "passwordHash" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  role "SystemRole",
  "isActive" BOOLEAN,
  "mfaEnabled" BOOLEAN,
  "mfaMethod" "MfaMethod",
  "phoneNumber" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, organization_id, organization_unit_id, email, password_hash, first_name, last_name, role, is_active, mfa_enabled, mfa_method, phone_number
  FROM users
  WHERE email = p_email AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_user_for_login(TEXT) TO africahr_app;
