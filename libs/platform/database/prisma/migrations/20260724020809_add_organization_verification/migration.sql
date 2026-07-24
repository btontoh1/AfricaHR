-- CreateEnum
CREATE TYPE "OrganizationVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('CERTIFICATE_OF_INCORPORATION', 'TAX_CLEARANCE_CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "verification_note" TEXT,
ADD COLUMN     "verification_status" "OrganizationVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT;

-- CreateTable
CREATE TABLE "organization_verification_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "document_type" "VerificationDocumentType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,

    CONSTRAINT "organization_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_verification_documents_tenant_id_idx" ON "organization_verification_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "organization_verification_documents_organization_id_idx" ON "organization_verification_documents"("organization_id");

-- AddForeignKey
ALTER TABLE "organization_verification_documents" ADD CONSTRAINT "organization_verification_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — non-nullable tenant_id, so the
-- plain policy applies. "organizations" itself already has its own policy
-- from the init migration; only this new table needs one here).
ALTER TABLE "organization_verification_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_verification_documents" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "organization_verification_documents"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
