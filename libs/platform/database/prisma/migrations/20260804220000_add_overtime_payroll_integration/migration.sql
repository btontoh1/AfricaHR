-- AlterEnum
ALTER TYPE "StatutoryRateCode" ADD VALUE 'OVERTIME_MULTIPLIER';

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN "overtime_pay" DECIMAL(65,30) NOT NULL DEFAULT 0;
