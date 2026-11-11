-- AlterEnum
ALTER TYPE "SystemRole" ADD VALUE 'KIOSK';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "clock_in_pin_hash" TEXT;
