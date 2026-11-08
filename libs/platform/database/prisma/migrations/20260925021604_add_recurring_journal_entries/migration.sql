-- AlterEnum
ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'RECURRING_JOURNAL_ENTRY';

-- CreateTable
CREATE TABLE "gl_recurring_journal_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "next_run_date" TIMESTAMP(3) NOT NULL,
    "last_run_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "gl_recurring_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_recurring_journal_entry_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "recurring_journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "gl_recurring_journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gl_recurring_journal_entries_tenant_id_idx" ON "gl_recurring_journal_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_recurring_journal_entries_organization_id_idx" ON "gl_recurring_journal_entries"("organization_id");

-- CreateIndex
CREATE INDEX "gl_recurring_journal_entry_lines_tenant_id_idx" ON "gl_recurring_journal_entry_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_recurring_journal_entry_lines_recurring_journal_entry_id_idx" ON "gl_recurring_journal_entry_lines"("recurring_journal_entry_id");

-- CreateIndex
CREATE INDEX "gl_recurring_journal_entry_lines_account_id_idx" ON "gl_recurring_journal_entry_lines"("account_id");

-- AddForeignKey
ALTER TABLE "gl_recurring_journal_entries" ADD CONSTRAINT "gl_recurring_journal_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_recurring_journal_entry_lines" ADD CONSTRAINT "gl_recurring_journal_entry_lines_recurring_journal_entry_i_fkey" FOREIGN KEY ("recurring_journal_entry_id") REFERENCES "gl_recurring_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_recurring_journal_entry_lines" ADD CONSTRAINT "gl_recurring_journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "gl_recurring_journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_recurring_journal_entries" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_recurring_journal_entries"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "gl_recurring_journal_entry_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_recurring_journal_entry_lines" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_recurring_journal_entry_lines"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Backs RecurringJournalEntryPoster's daily @Cron sweep, which finds every
-- active template due to post across every tenant before any tenant
-- context exists yet - same "resolve before any single tenant is known"
-- shape as find_stale_pending_payslip_disbursements (see
-- RLS_CONVENTION.md §5). Returns only the identifying (id, tenantId) pair;
-- the poster re-reads the full template (lines included) through the
-- ordinary tenant-scoped repository once it knows which tenant it's
-- working with, so every subsequent read/write still goes through RLS
-- normally.
CREATE FUNCTION find_due_recurring_journal_entries(p_as_of TIMESTAMP(3))
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id
  FROM gl_recurring_journal_entries
  WHERE is_active = true
    AND next_run_date <= p_as_of
    AND (end_date IS NULL OR next_run_date <= end_date);
$$;

GRANT EXECUTE ON FUNCTION find_due_recurring_journal_entries(TIMESTAMP(3)) TO africahr_app;
