-- CreateEnum
CREATE TYPE "AddOnModule" AS ENUM ('INVOICING');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "enabled_add_ons" "AddOnModule"[] DEFAULT ARRAY[]::"AddOnModule"[];
