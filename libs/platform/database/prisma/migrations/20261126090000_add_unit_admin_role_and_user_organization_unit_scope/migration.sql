-- AlterEnum
ALTER TYPE "SystemRole" ADD VALUE 'UNIT_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organization_unit_id" TEXT;

-- CreateIndex
CREATE INDEX "users_organization_unit_id_idx" ON "users"("organization_unit_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
