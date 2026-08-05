-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('TOTP', 'SMS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfa_method" "MfaMethod",
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "phone_number_verified_at" TIMESTAMP(3);

-- AuthService.authenticate() needs mfaMethod (to decide whether to send an
-- SMS code) and phoneNumber (to send it to) at the pre-tenant-context login
-- lookup, same reasoning as the earlier widening that added mfaEnabled -
-- see 20260728035932_update_find_user_for_login_mfa. Postgres refuses
-- CREATE OR REPLACE when a RETURNS TABLE column list changes, so this must
-- drop and recreate - same name, same SECURITY DEFINER owner, re-granted
-- below.
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
  "mfaEnabled" BOOLEAN,
  "mfaMethod" "MfaMethod",
  "phoneNumber" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, email, password_hash, first_name, last_name, role, is_active, mfa_enabled, mfa_method, phone_number
  FROM users
  WHERE email = p_email AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_user_for_login(TEXT) TO africahr_app;
