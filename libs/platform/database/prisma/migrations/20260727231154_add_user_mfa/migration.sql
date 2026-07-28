-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfa_enabled_at" TIMESTAMP(3),
ADD COLUMN     "mfa_secret_encrypted" TEXT;

-- CreateTable
CREATE TABLE "mfa_backup_codes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mfa_backup_codes_tenant_id_idx" ON "mfa_backup_codes"("tenant_id");

-- CreateIndex
CREATE INDEX "mfa_backup_codes_user_id_idx" ON "mfa_backup_codes"("user_id");

-- AddForeignKey
ALTER TABLE "mfa_backup_codes" ADD CONSTRAINT "mfa_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-Level Security (see RLS_CONVENTION.md §4 - tenantId is nullable here,
-- same as on "users" itself, so this needs the platform-sentinel variant,
-- not the plain single-tenant policy).
ALTER TABLE "mfa_backup_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mfa_backup_codes" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "mfa_backup_codes"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );
