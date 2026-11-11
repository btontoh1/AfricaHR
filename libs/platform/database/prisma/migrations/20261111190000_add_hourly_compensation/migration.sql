-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('SALARY', 'HOURLY');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "compensation_type" "CompensationType" NOT NULL DEFAULT 'SALARY',
ADD COLUMN     "hourly_rate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "regular_hours_worked" DECIMAL(65,30),
ADD COLUMN     "hourly_rate_applied" DECIMAL(65,30);
