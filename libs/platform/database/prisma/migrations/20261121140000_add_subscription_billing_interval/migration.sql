-- Adds a real billing cadence to subscriptions: MONTHLY (the default,
-- preserving every existing tenant's current behaviour exactly) or
-- ANNUAL, where a period spans 12 months instead of 1.
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
ALTER TABLE "subscriptions" ADD COLUMN "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';

-- platform_list_subscriptions() must expose billing_interval too - MRR
-- needs it to normalize an ANNUAL subscription's period amount down to a
-- monthly-equivalent before summing (see summarizeMonthlyRecurringRevenue).
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
  "billingInterval" "BillingInterval",
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
         billing_interval, created_at, updated_at, created_by, updated_by
  FROM subscriptions;
$$;

GRANT EXECUTE ON FUNCTION platform_list_subscriptions() TO africahr_app;
