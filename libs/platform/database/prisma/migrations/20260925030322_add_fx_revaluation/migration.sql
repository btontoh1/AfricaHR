-- AlterEnum
ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'FX_REVALUATION';

-- CreateTable
CREATE TABLE "gl_home_currencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "gl_home_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_fx_revaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "previous_rate" DECIMAL(65,30),
    "gain_loss" DECIMAL(65,30),
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "gl_fx_revaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gl_home_currencies_organization_id_key" ON "gl_home_currencies"("organization_id");

-- CreateIndex
CREATE INDEX "gl_home_currencies_tenant_id_idx" ON "gl_home_currencies"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_fx_revaluations_tenant_id_idx" ON "gl_fx_revaluations"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_fx_revaluations_organization_id_currency_idx" ON "gl_fx_revaluations"("organization_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "gl_fx_revaluations_organization_id_currency_as_of_date_key" ON "gl_fx_revaluations"("organization_id", "currency", "as_of_date");

-- AddForeignKey
ALTER TABLE "gl_home_currencies" ADD CONSTRAINT "gl_home_currencies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_fx_revaluations" ADD CONSTRAINT "gl_fx_revaluations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_fx_revaluations" ADD CONSTRAINT "gl_fx_revaluations_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "gl_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "gl_home_currencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_home_currencies" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_home_currencies"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "gl_fx_revaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_fx_revaluations" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_fx_revaluations"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
