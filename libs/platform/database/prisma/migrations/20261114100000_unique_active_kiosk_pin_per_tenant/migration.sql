-- The application-level duplicate-PIN check (AttendanceKioskService.setPin,
-- EmployeeBulkImportService.generateUniquePin) was check-then-write with no
-- database constraint behind it, so two concurrent writes for different
-- employees could both pass the check before either commits, leaving two
-- employees with the identical PIN. This index is the real guard: a plain
-- UNIQUE constraint would also need to know "active employee" (deleted_at
-- IS NULL AND employment_status != 'TERMINATED', the same definition used
-- by platform_active_employee_counts and isPinLookupHashTaken) so a
-- terminated employee's old PIN doesn't block it from ever being reassigned
-- - Postgres partial unique indexes support exactly that WHERE clause,
-- which Prisma's schema-level @@unique cannot express, hence a raw
-- migration instead of a schema.prisma change. NULLs (no PIN set) are never
-- considered equal by a unique index, so employees without a PIN are
-- unaffected.
DROP INDEX "employees_tenant_id_clock_in_pin_lookup_hash_idx";

CREATE UNIQUE INDEX "employees_active_tenant_pin_lookup_hash_key"
ON "employees" ("tenant_id", "clock_in_pin_lookup_hash")
WHERE "deleted_at" IS NULL AND "employment_status" != 'TERMINATED';
