-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "payslip_sms_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payslip_whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false;
