-- AlterTable
ALTER TABLE "payslips" ADD COLUMN "benefits_employee_deduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "benefits_employer_cost" DECIMAL(65,30) NOT NULL DEFAULT 0;
