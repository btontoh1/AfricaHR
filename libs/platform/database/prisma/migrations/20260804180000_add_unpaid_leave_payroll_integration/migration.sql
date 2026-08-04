-- AlterTable
ALTER TABLE "payslips" ADD COLUMN "unpaid_leave_deduction" DECIMAL(65,30) NOT NULL DEFAULT 0;
