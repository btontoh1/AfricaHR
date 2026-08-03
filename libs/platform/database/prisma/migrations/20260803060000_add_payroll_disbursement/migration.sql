-- CreateEnum
CREATE TYPE "PayslipDisbursementStatus" AS ENUM ('NOT_INITIATED', 'PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "employee_payment_methods" ADD COLUMN "bank_code" TEXT;

-- AlterTable
ALTER TABLE "payslips"
  ADD COLUMN "disbursement_status" "PayslipDisbursementStatus" NOT NULL DEFAULT 'NOT_INITIATED',
  ADD COLUMN "paystack_recipient_code" TEXT,
  ADD COLUMN "paystack_transfer_reference" TEXT,
  ADD COLUMN "disbursed_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "payslips_paystack_transfer_reference_key" ON "payslips"("paystack_transfer_reference");
