-- CreateEnum
CREATE TYPE "AudienceScope" AS ENUM ('TENANT', 'ORGANIZATION', 'ORGANIZATION_UNIT');

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedes_id" TEXT,
    "audience_scope" "AudienceScope" NOT NULL,
    "organization_id" TEXT,
    "organization_unit_id" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_acknowledgements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policies_supersedes_id_key" ON "policies"("supersedes_id");
CREATE INDEX "policies_tenant_id_idx" ON "policies"("tenant_id");
CREATE INDEX "policies_organization_id_idx" ON "policies"("organization_id");
CREATE INDEX "policies_organization_unit_id_idx" ON "policies"("organization_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acknowledgements_policy_id_employee_id_key" ON "policy_acknowledgements"("policy_id", "employee_id");
CREATE INDEX "policy_acknowledgements_tenant_id_idx" ON "policy_acknowledgements"("tenant_id");
CREATE INDEX "policy_acknowledgements_employee_id_idx" ON "policy_acknowledgements"("employee_id");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policies" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "policies"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "policy_acknowledgements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policy_acknowledgements" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "policy_acknowledgements"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
