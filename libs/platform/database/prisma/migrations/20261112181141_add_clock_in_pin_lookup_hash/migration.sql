-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "clock_in_pin_lookup_hash" TEXT;

-- CreateIndex
CREATE INDEX "employees_tenant_id_clock_in_pin_lookup_hash_idx" ON "employees"("tenant_id", "clock_in_pin_lookup_hash");
