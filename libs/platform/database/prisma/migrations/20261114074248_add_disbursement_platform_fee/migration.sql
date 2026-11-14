-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "disbursement_fee_amount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "disbursement_fee_amount" DECIMAL(65,30) DEFAULT 0;
