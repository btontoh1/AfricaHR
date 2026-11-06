-- CreateEnum
CREATE TYPE "PerformanceFramework" AS ENUM ('STANDARD', 'BALANCED_SCORECARD');

-- CreateEnum
CREATE TYPE "GoalPerspective" AS ENUM ('FINANCIAL', 'CUSTOMER', 'PEOPLE', 'RISK_CONTROL');

-- AlterTable
ALTER TABLE "performance_goals" ADD COLUMN     "perspective" "GoalPerspective";

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "performance_framework" "PerformanceFramework" NOT NULL DEFAULT 'STANDARD';
