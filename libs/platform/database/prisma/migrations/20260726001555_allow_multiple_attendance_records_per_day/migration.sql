-- DropIndex
DROP INDEX "attendance_records_tenant_id_employee_id_date_key";

-- CreateIndex
CREATE INDEX "attendance_records_tenant_id_employee_id_date_idx" ON "attendance_records"("tenant_id", "employee_id", "date");
