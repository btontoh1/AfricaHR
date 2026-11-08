-- CreateEnum
CREATE TYPE "IdentityDocumentType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'OTHER');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "identity_document_file_name" TEXT,
ADD COLUMN     "identity_document_storage_key" TEXT,
ADD COLUMN     "identity_document_type" "IdentityDocumentType",
ADD COLUMN     "resume_file_name" TEXT,
ADD COLUMN     "resume_storage_key" TEXT;
