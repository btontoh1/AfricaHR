-- CreateEnum
CREATE TYPE "VendorPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHEQUE', 'MOBILE_MONEY', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OFFICE_SUPPLIES', 'TRAVEL', 'UTILITIES', 'MEALS_AND_ENTERTAINMENT', 'PROFESSIONAL_SERVICES', 'RENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpensePaidBy" AS ENUM ('COMPANY', 'EMPLOYEE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'VENDOR_PAYMENT';
ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'EXPENSE_RECORDED';
ALTER TYPE "GlJournalEntrySourceType" ADD VALUE 'EXPENSE_REIMBURSED';

-- AlterEnum
ALTER TYPE "VendorBillStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "vendor_bills" ADD COLUMN     "amount_paid" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "VendorPaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payment_allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "vendor_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "paid_by" "ExpensePaidBy" NOT NULL,
    "reimbursed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_payments_tenant_id_idx" ON "vendor_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_payments_organization_id_idx" ON "vendor_payments"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_payments_vendor_id_idx" ON "vendor_payments"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_payment_allocations_tenant_id_idx" ON "vendor_payment_allocations"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_payment_allocations_payment_id_idx" ON "vendor_payment_allocations"("payment_id");

-- CreateIndex
CREATE INDEX "vendor_payment_allocations_bill_id_idx" ON "vendor_payment_allocations"("bill_id");

-- CreateIndex
CREATE INDEX "expenses_tenant_id_idx" ON "expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "expenses_organization_id_idx" ON "expenses"("organization_id");

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payment_allocations" ADD CONSTRAINT "vendor_payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "vendor_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payment_allocations" ADD CONSTRAINT "vendor_payment_allocations_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "vendor_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "vendor_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_payments" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "vendor_payments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "vendor_payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_payment_allocations" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "vendor_payment_allocations"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "expenses"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
