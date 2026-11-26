-- CreateEnum
CREATE TYPE "WeeklyReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "weekly_report_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_unit_id" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "weekly_report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "answers" JSONB NOT NULL,
    "status" "WeeklyReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_report_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "weekly_report_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_report_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_report_templates_organization_unit_id_key" ON "weekly_report_templates"("organization_unit_id");
CREATE INDEX "weekly_report_templates_tenant_id_idx" ON "weekly_report_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_employee_id_week_start_key" ON "weekly_reports"("employee_id", "week_start");
CREATE INDEX "weekly_reports_tenant_id_idx" ON "weekly_reports"("tenant_id");
CREATE INDEX "weekly_reports_week_start_idx" ON "weekly_reports"("week_start");

-- CreateIndex
CREATE INDEX "weekly_report_comments_tenant_id_idx" ON "weekly_report_comments"("tenant_id");
CREATE INDEX "weekly_report_comments_weekly_report_id_idx" ON "weekly_report_comments"("weekly_report_id");

-- AddForeignKey
ALTER TABLE "weekly_report_templates" ADD CONSTRAINT "weekly_report_templates_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weekly_report_comments" ADD CONSTRAINT "weekly_report_comments_weekly_report_id_fkey" FOREIGN KEY ("weekly_report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "weekly_report_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weekly_report_templates" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "weekly_report_templates"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "weekly_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weekly_reports" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "weekly_reports"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "weekly_report_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weekly_report_comments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "weekly_report_comments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Cross-tenant reminder sweep (see WeeklyReportReminderService): one row
-- per employee, across every tenant, who has a login but hasn't submitted
-- a report for the given week - same §5 SECURITY DEFINER escape hatch as
-- find_active_tenant_admins(), since RLS would otherwise hide every
-- tenant's rows from this single cross-tenant query.
CREATE FUNCTION find_employees_missing_weekly_report(p_week_start DATE)
RETURNS TABLE (
  "tenantId" TEXT,
  "userId" TEXT,
  "employeeId" TEXT,
  "firstName" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.tenant_id, e.user_id, e.id, e.first_name
  FROM employees e
  JOIN tenants t ON t.id = e.tenant_id
  WHERE e.user_id IS NOT NULL
    AND e.deleted_at IS NULL
    AND e.employment_status = 'ACTIVE'
    AND t.status != 'CLOSED'
    AND t.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM weekly_reports wr
      WHERE wr.employee_id = e.id
        AND wr.week_start = p_week_start
        AND wr.status = 'SUBMITTED'
        AND wr.deleted_at IS NULL
    );
$$;

GRANT EXECUTE ON FUNCTION find_employees_missing_weekly_report(DATE) TO africahr_app;
