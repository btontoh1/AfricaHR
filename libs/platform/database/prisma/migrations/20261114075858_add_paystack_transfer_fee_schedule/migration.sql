-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "paystack_fee_amount" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "paystack_transfer_fee_rates" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "channel" "PaymentMethodType" NOT NULL,
    "fee_amount" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "paystack_transfer_fee_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paystack_transfer_fee_rates_currency_channel_key" ON "paystack_transfer_fee_rates"("currency", "channel");
