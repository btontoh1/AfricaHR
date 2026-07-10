-- CreateEnum
CREATE TYPE "BenefitContributionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "BenefitEnrollmentStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "benefit_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "contribution_type" "BenefitContributionType" NOT NULL,
    "employee_contribution" DECIMAL(65,30) NOT NULL,
    "employer_contribution" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "benefit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "benefit_plan_id" TEXT NOT NULL,
    "status" "BenefitEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "effective_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "benefit_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benefit_plans_tenant_id_idx" ON "benefit_plans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "benefit_plans_tenant_id_code_key" ON "benefit_plans"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "benefit_enrollments_tenant_id_idx" ON "benefit_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "benefit_enrollments_employee_id_idx" ON "benefit_enrollments"("employee_id");

-- CreateIndex
CREATE INDEX "benefit_enrollments_benefit_plan_id_idx" ON "benefit_enrollments"("benefit_plan_id");

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_benefit_plan_id_fkey" FOREIGN KEY ("benefit_plan_id") REFERENCES "benefit_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — both tables have a non-nullable
-- tenant_id, so the plain policy applies).
ALTER TABLE "benefit_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefit_plans" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "benefit_plans"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "benefit_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "benefit_enrollments" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "benefit_enrollments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
