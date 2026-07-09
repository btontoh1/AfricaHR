-- CreateEnum
CREATE TYPE "StatutoryRateCode" AS ENUM ('SSNIT_EMPLOYEE', 'SSNIT_EMPLOYER');

-- CreateEnum
CREATE TYPE "PayRunStatus" AS ENUM ('DRAFT', 'PROCESSING', 'APPROVED', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "PayslipLineItemType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateTable
CREATE TABLE "statutory_tax_bands" (
    "id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lower_bound" DECIMAL(65,30) NOT NULL,
    "upper_bound" DECIMAL(65,30),
    "rate" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "statutory_tax_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statutory_rates" (
    "id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "code" "StatutoryRateCode" NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "statutory_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "status" "PayRunStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "pay_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pay_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "country_code" TEXT NOT NULL,
    "basic_salary" DECIMAL(65,30) NOT NULL,
    "gross_pay" DECIMAL(65,30) NOT NULL,
    "taxable_income" DECIMAL(65,30) NOT NULL,
    "paye_tax" DECIMAL(65,30) NOT NULL,
    "ssnit_employee" DECIMAL(65,30) NOT NULL,
    "ssnit_employer" DECIMAL(65,30) NOT NULL,
    "total_deductions" DECIMAL(65,30) NOT NULL,
    "net_pay" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payslip_id" TEXT NOT NULL,
    "type" "PayslipLineItemType" NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "payslip_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "statutory_tax_bands_country_code_effective_from_idx" ON "statutory_tax_bands"("country_code", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "statutory_rates_country_code_code_effective_from_key" ON "statutory_rates"("country_code", "code", "effective_from");

-- CreateIndex
CREATE INDEX "pay_runs_tenant_id_idx" ON "pay_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "pay_runs_organization_id_idx" ON "pay_runs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "pay_runs_tenant_id_organization_id_period_start_period_end_key" ON "pay_runs"("tenant_id", "organization_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "payslips_tenant_id_idx" ON "payslips"("tenant_id");

-- CreateIndex
CREATE INDEX "payslips_pay_run_id_idx" ON "payslips"("pay_run_id");

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_pay_run_id_employee_id_key" ON "payslips"("pay_run_id", "employee_id");

-- CreateIndex
CREATE INDEX "payslip_line_items_tenant_id_idx" ON "payslip_line_items"("tenant_id");

-- CreateIndex
CREATE INDEX "payslip_line_items_payslip_id_idx" ON "payslip_line_items"("payslip_id");

-- AddForeignKey
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_pay_run_id_fkey" FOREIGN KEY ("pay_run_id") REFERENCES "pay_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_line_items" ADD CONSTRAINT "payslip_line_items_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — statutory_tax_bands and
-- statutory_rates are platform-root reference data, same exemption as
-- "tenants", and intentionally have no RLS policy).
ALTER TABLE "pay_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pay_runs" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "pay_runs"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "payslips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payslips" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "payslips"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "payslip_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payslip_line_items" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "payslip_line_items"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
