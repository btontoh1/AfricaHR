-- CreateEnum
CREATE TYPE "PerformanceGoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PerformanceReviewCycleStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PerformanceReviewStatus" AS ENUM ('DRAFT', 'SELF_SUBMITTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "performance_goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3),
    "status" "PerformanceGoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_review_cycles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "PerformanceReviewCycleStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "performance_review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "status" "PerformanceReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "self_rating" INTEGER,
    "self_comments" TEXT,
    "self_submitted_at" TIMESTAMP(3),
    "manager_rating" INTEGER,
    "manager_comments" TEXT,
    "manager_user_id" TEXT,
    "manager_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_goals_tenant_id_idx" ON "performance_goals"("tenant_id");

-- CreateIndex
CREATE INDEX "performance_goals_employee_id_idx" ON "performance_goals"("employee_id");

-- CreateIndex
CREATE INDEX "performance_review_cycles_tenant_id_idx" ON "performance_review_cycles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_review_cycles_tenant_id_name_key" ON "performance_review_cycles"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "performance_reviews_tenant_id_idx" ON "performance_reviews"("tenant_id");

-- CreateIndex
CREATE INDEX "performance_reviews_employee_id_idx" ON "performance_reviews"("employee_id");

-- CreateIndex
CREATE INDEX "performance_reviews_cycle_id_idx" ON "performance_reviews"("cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_tenant_id_employee_id_cycle_id_key" ON "performance_reviews"("tenant_id", "employee_id", "cycle_id");

-- AddForeignKey
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "performance_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — all three tables have a
-- non-nullable tenant_id, so the plain policy applies).
ALTER TABLE "performance_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_goals" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "performance_goals"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "performance_review_cycles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_review_cycles" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "performance_review_cycles"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "performance_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "performance_reviews" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "performance_reviews"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
