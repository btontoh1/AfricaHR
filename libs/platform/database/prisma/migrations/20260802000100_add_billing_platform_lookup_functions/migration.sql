-- Platform-wide billing aggregates (MRR, platform revenue, expiring
-- subscriptions) read across every tenant's subscriptions/invoices at once,
-- which a platform-admin request has no single tenant context for.
-- "subscriptions"/"invoices"/"employees" all have non-nullable tenant_id,
-- so they use the plain tenant_isolation policy (RLS_CONVENTION.md §2) -
-- unlike the nullable-tenant §4 case, that policy has no platform-sentinel
-- branch, so withPlatformScope would silently return zero rows here (same
-- reasoning as find_organizations_pending_review). These are the §5
-- SECURITY DEFINER exception, narrowly scoped to exactly the columns
-- billing needs.

-- Decimal columns are cast to TEXT rather than returned as DECIMAL: pg's
-- wire format for NUMERIC is deserialized differently across raw-query
-- paths, and this repo has no existing $queryRaw+Decimal precedent to
-- confirm which representation a driver-adapter raw query would produce.
-- Casting to text and parsing with Number() in the repository sidesteps
-- that ambiguity entirely.
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
         paystack_customer_code, created_at, updated_at, created_by, updated_by
  FROM subscriptions;
$$;

GRANT EXECUTE ON FUNCTION platform_list_subscriptions() TO africahr_app;

-- Active employee counts per tenant, same "!= TERMINATED" definition as
-- HeadcountReportRepository.countActive - used to weight per-seat MRR by
-- each tenant's current headcount.
CREATE FUNCTION platform_active_employee_counts()
RETURNS TABLE ("tenantId" TEXT, "activeCount" TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id, count(*)::TEXT
  FROM employees
  WHERE deleted_at IS NULL AND employment_status != 'TERMINATED'
  GROUP BY tenant_id;
$$;

GRANT EXECUTE ON FUNCTION platform_active_employee_counts() TO africahr_app;

-- "Platform revenue" = total paid invoice amount, grouped by currency
-- (never blended into one number - same reasoning as
-- summarizePayrollCosts/summarizeMonthlyRecurringRevenue).
CREATE FUNCTION platform_invoice_revenue_by_currency()
RETURNS TABLE (currency TEXT, "totalPaid" TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT currency, COALESCE(SUM(amount), 0)::TEXT
  FROM invoices
  WHERE status = 'PAID'
  GROUP BY currency;
$$;

GRANT EXECUTE ON FUNCTION platform_invoice_revenue_by_currency() TO africahr_app;

-- The Paystack webhook identifies an invoice only by its payment reference
-- (paystack_reference), globally unique but with no tenant context
-- attached to the webhook payload - the same "resolve before any tenant is
-- known" shape as find_user_for_login, applied to invoices instead of
-- users.
CREATE FUNCTION find_invoice_by_paystack_reference_across_tenants(p_reference TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "subscriptionId" TEXT,
  amount TEXT,
  currency TEXT,
  "employeeCountAtIssue" INTEGER,
  status "InvoiceStatus",
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "paystackReference" TEXT,
  "checkoutUrl" TEXT,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, subscription_id, amount::TEXT, currency, employee_count_at_issue,
         status, period_start, period_end, due_date, paid_at, paystack_reference,
         checkout_url, created_at, updated_at, created_by, updated_by
  FROM invoices
  WHERE paystack_reference = p_reference;
$$;

GRANT EXECUTE ON FUNCTION find_invoice_by_paystack_reference_across_tenants(TEXT) TO africahr_app;
