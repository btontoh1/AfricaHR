-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_key" TEXT,
    "attachment_file_name" TEXT,
    "audience_scope" "AudienceScope" NOT NULL,
    "organization_id" TEXT,
    "organization_unit_id" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_tenant_id_idx" ON "announcements"("tenant_id");
CREATE INDEX "announcements_organization_id_idx" ON "announcements"("organization_id");
CREATE INDEX "announcements_organization_unit_id_idx" ON "announcements"("organization_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_employee_id_key" ON "announcement_reads"("announcement_id", "employee_id");
CREATE INDEX "announcement_reads_tenant_id_idx" ON "announcement_reads"("tenant_id");
CREATE INDEX "announcement_reads_employee_id_idx" ON "announcement_reads"("employee_id");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "announcements"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "announcement_reads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcement_reads" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "announcement_reads"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
