-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "default_entitlement_days" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "entitled_days" DECIMAL(65,30) NOT NULL,
    "used_days" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days_requested" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approver_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_types_tenant_id_idx" ON "leave_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_tenant_id_code_key" ON "leave_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "leave_balances_tenant_id_idx" ON "leave_balances"("tenant_id");

-- CreateIndex
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_tenant_id_employee_id_leave_type_id_year_key" ON "leave_balances"("tenant_id", "employee_id", "leave_type_id", "year");

-- CreateIndex
CREATE INDEX "leave_requests_tenant_id_idx" ON "leave_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_leave_type_id_idx" ON "leave_requests"("leave_type_id");

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — all three tables have a
-- non-nullable tenant_id, so the plain policy applies).
ALTER TABLE "leave_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_types" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "leave_types"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "leave_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_balances" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "leave_balances"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_requests" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "leave_requests"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
