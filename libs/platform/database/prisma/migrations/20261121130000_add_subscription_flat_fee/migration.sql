-- Adds flat-rate billing alongside the existing per-employee pricing: a
-- fixed charge per period (flatFeeAmount) plus how many employees it
-- already covers (includedEmployeeCount) before pricePerEmployee kicks in
-- for the remainder. Both default to 0, which reproduces today's pure
-- per-seat behaviour exactly for every existing tenant.
ALTER TABLE "subscriptions" ADD COLUMN "flat_fee_amount" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN "included_employee_count" INTEGER DEFAULT 0;

-- platform_list_subscriptions()'s return shape must change to expose the
-- two new columns to PlatformBillingRepository.listAllSubscriptions() (MRR
-- now needs them) - Postgres requires DROP+CREATE, not CREATE OR REPLACE,
-- to change a function's RETURNS TABLE shape.
DROP FUNCTION platform_list_subscriptions();

CREATE FUNCTION platform_list_subscriptions()
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "pricePerEmployee" TEXT,
  currency TEXT,
  status "SubscriptionStatus",
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN,
  "paystackCustomerCode" TEXT,
  "flatFeeAmount" TEXT,
  "includedEmployeeCount" INTEGER,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, price_per_employee::TEXT, currency, status,
         current_period_start, current_period_end, cancel_at_period_end,
         paystack_customer_code, flat_fee_amount::TEXT, included_employee_count,
         created_at, updated_at, created_by, updated_by
  FROM subscriptions;
$$;

GRANT EXECUTE ON FUNCTION platform_list_subscriptions() TO africahr_app;
