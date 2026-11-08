-- AlterTable
ALTER TABLE "gl_journal_entries" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "cost_center_id" TEXT,
ADD COLUMN     "organization_unit_id" TEXT;

-- CreateTable
CREATE TABLE "gl_cost_centers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "gl_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gl_cost_centers_tenant_id_idx" ON "gl_cost_centers"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_cost_centers_organization_id_idx" ON "gl_cost_centers"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "gl_cost_centers_organization_id_name_key" ON "gl_cost_centers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "gl_journal_entries_organization_unit_id_idx" ON "gl_journal_entries"("organization_unit_id");

-- CreateIndex
CREATE INDEX "gl_journal_entries_cost_center_id_idx" ON "gl_journal_entries"("cost_center_id");

-- AddForeignKey
ALTER TABLE "gl_journal_entries" ADD CONSTRAINT "gl_journal_entries_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_journal_entries" ADD CONSTRAINT "gl_journal_entries_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "gl_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_cost_centers" ADD CONSTRAINT "gl_cost_centers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "gl_cost_centers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_cost_centers" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_cost_centers"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
