-- CreateEnum
CREATE TYPE "GlAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "GlJournalEntrySourceType" AS ENUM ('PAY_RUN_DISBURSED', 'CUSTOMER_INVOICE_SENT', 'CUSTOMER_INVOICE_PAID', 'MANUAL');

-- CreateTable
CREATE TABLE "gl_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GlAccountType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_journal_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" "GlJournalEntrySourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "gl_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_journal_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gl_journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gl_accounts_tenant_id_idx" ON "gl_accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "gl_accounts_tenant_id_code_key" ON "gl_accounts"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "gl_journal_entries_tenant_id_idx" ON "gl_journal_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_journal_entries_organization_id_idx" ON "gl_journal_entries"("organization_id");

-- CreateIndex
CREATE INDEX "gl_journal_entries_entry_date_idx" ON "gl_journal_entries"("entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "gl_journal_entries_source_type_source_id_key" ON "gl_journal_entries"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "gl_journal_lines_tenant_id_idx" ON "gl_journal_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_journal_lines_journal_entry_id_idx" ON "gl_journal_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "gl_journal_lines_account_id_idx" ON "gl_journal_lines"("account_id");

-- AddForeignKey
ALTER TABLE "gl_journal_entries" ADD CONSTRAINT "gl_journal_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "gl_journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_journal_lines" ADD CONSTRAINT "gl_journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "gl_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_accounts" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_accounts"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "gl_journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_journal_entries" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_journal_entries"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "gl_journal_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_journal_lines" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_journal_lines"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
