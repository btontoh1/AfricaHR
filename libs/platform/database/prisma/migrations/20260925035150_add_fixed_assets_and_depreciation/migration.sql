-- CreateEnum
CREATE TYPE "FixedAssetStatus" AS ENUM ('ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'FIXED_ASSET_ACQUIRED';
ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'DEPRECIATION_RUN';

-- CreateTable
CREATE TABLE "gl_fixed_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "salvage_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "useful_life_months" INTEGER NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "status" "FixedAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "accumulated_depreciation" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "next_depreciation_date" TIMESTAMP(3),
    "last_depreciation_date" TIMESTAMP(3),
    "disposed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "gl_fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_depreciation_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "total_depreciation" DECIMAL(65,30) NOT NULL,
    "asset_count" INTEGER NOT NULL,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "gl_depreciation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gl_fixed_assets_tenant_id_idx" ON "gl_fixed_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_fixed_assets_organization_id_currency_idx" ON "gl_fixed_assets"("organization_id", "currency");

-- CreateIndex
CREATE INDEX "gl_depreciation_runs_tenant_id_idx" ON "gl_depreciation_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_depreciation_runs_organization_id_currency_idx" ON "gl_depreciation_runs"("organization_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "gl_depreciation_runs_organization_id_currency_as_of_date_key" ON "gl_depreciation_runs"("organization_id", "currency", "as_of_date");

-- AddForeignKey
ALTER TABLE "gl_fixed_assets" ADD CONSTRAINT "gl_fixed_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_depreciation_runs" ADD CONSTRAINT "gl_depreciation_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_depreciation_runs" ADD CONSTRAINT "gl_depreciation_runs_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "gl_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "gl_fixed_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_fixed_assets" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_fixed_assets"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "gl_depreciation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_depreciation_runs" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_depreciation_runs"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
