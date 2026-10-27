-- CreateEnum
CREATE TYPE "WalletTopUpStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "tenant_payroll_wallets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tenant_payroll_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_wallet_top_ups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "WalletTopUpStatus" NOT NULL DEFAULT 'PENDING',
    "paystack_reference" TEXT,
    "checkout_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tenant_wallet_top_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payroll_wallets_tenant_id_currency_key" ON "tenant_payroll_wallets"("tenant_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_wallet_top_ups_paystack_reference_key" ON "tenant_wallet_top_ups"("paystack_reference");

-- CreateIndex
CREATE INDEX "tenant_wallet_top_ups_tenant_id_idx" ON "tenant_wallet_top_ups"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_wallet_top_ups_status_idx" ON "tenant_wallet_top_ups"("status");

-- AddForeignKey
ALTER TABLE "tenant_payroll_wallets" ADD CONSTRAINT "tenant_payroll_wallets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_wallet_top_ups" ADD CONSTRAINT "tenant_wallet_top_ups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Both tables have non-nullable tenant_id, so they use the plain
-- tenant_isolation policy (RLS_CONVENTION.md §2) - same pattern as
-- subscriptions/invoices.
ALTER TABLE "tenant_payroll_wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_payroll_wallets" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "tenant_payroll_wallets"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "tenant_wallet_top_ups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_wallet_top_ups" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "tenant_wallet_top_ups"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- The Paystack webhook identifies a top-up only by its payment reference
-- (paystack_reference), globally unique but with no tenant context
-- attached to the webhook payload - same "resolve before any tenant is
-- known" shape as find_invoice_by_paystack_reference_across_tenants,
-- applied to wallet top-ups instead of invoices (§5 SECURITY DEFINER
-- exception).
CREATE FUNCTION find_wallet_topup_by_paystack_reference_across_tenants(p_reference TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  currency TEXT,
  amount TEXT,
  status "WalletTopUpStatus",
  "paystackReference" TEXT,
  "checkoutUrl" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, currency, amount::TEXT, status, paystack_reference,
         checkout_url, paid_at, created_at, updated_at, created_by, updated_by
  FROM tenant_wallet_top_ups
  WHERE paystack_reference = p_reference;
$$;

GRANT EXECUTE ON FUNCTION find_wallet_topup_by_paystack_reference_across_tenants(TEXT) TO africahr_app;
