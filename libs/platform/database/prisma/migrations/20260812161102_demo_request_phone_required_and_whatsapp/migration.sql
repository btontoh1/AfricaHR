-- Backfill any existing rows with no phone number before enforcing NOT NULL.
UPDATE "demo_requests" SET "phone_number" = '' WHERE "phone_number" IS NULL;

-- AlterTable
ALTER TABLE "demo_requests"
  ALTER COLUMN "phone_number" SET NOT NULL,
  ADD COLUMN "is_whatsapp" BOOLEAN NOT NULL DEFAULT false;
