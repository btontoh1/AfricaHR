-- CreateTable
CREATE TABLE "mfa_trusted_devices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_trusted_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_trusted_devices_token_hash_key" ON "mfa_trusted_devices"("token_hash");

-- CreateIndex
CREATE INDEX "mfa_trusted_devices_tenant_id_idx" ON "mfa_trusted_devices"("tenant_id");

-- CreateIndex
CREATE INDEX "mfa_trusted_devices_user_id_idx" ON "mfa_trusted_devices"("user_id");

-- AddForeignKey
ALTER TABLE "mfa_trusted_devices" ADD CONSTRAINT "mfa_trusted_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-Level Security (see RLS_CONVENTION.md §4 - tenantId is nullable here,
-- same as on "users" and "mfa_backup_codes", so this needs the
-- platform-sentinel variant, not the plain single-tenant policy).
ALTER TABLE "mfa_trusted_devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mfa_trusted_devices" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "mfa_trusted_devices"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );
