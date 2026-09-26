-- CreateEnum
CREATE TYPE "PlatformFinancialInputType" AS ENUM ('ACQUISITION_COST', 'CASH_BALANCE');

-- CreateTable
CREATE TABLE "platform_financial_inputs" (
    "id" TEXT NOT NULL,
    "type" "PlatformFinancialInputType" NOT NULL,
    "month" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "platform_financial_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_financial_inputs_type_month_currency_key" ON "platform_financial_inputs"("type", "month", "currency");
