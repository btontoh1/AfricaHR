-- CreateEnum
CREATE TYPE "FamilyMemberRelationship" AS ENUM ('PARENT', 'CHILD');

-- CreateTable
CREATE TABLE "employee_family_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "relationship" "FamilyMemberRelationship" NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_family_members_tenant_id_idx" ON "employee_family_members"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_family_members_employee_id_idx" ON "employee_family_members"("employee_id");

-- AddForeignKey
ALTER TABLE "employee_family_members" ADD CONSTRAINT "employee_family_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "employee_family_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_family_members" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "employee_family_members"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
