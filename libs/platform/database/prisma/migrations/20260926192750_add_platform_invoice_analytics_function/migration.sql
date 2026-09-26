-- Platform-wide SaaS analytics (MRR history, net-new MRR waterfall, churn,
-- cohort retention) need every invoice's tenant/currency/amount/period
-- across every tenant at once, same cross-tenant read problem as the other
-- platform billing aggregates. "invoices" has non-nullable tenant_id, so
-- (RLS_CONVENTION.md §5, same reasoning as platform_invoice_revenue_by_currency)
-- this is a narrow SECURITY DEFINER function rather than withPlatformScope.
--
-- Unlike platform_invoice_revenue_by_currency (a single summed total), this
-- returns one row per invoice so the caller can group by month/tenant
-- itself - MRR history has no other source: Subscription only ever holds
-- current state, there's no table anywhere recording past status/price
-- changes, so historical recurring revenue can only be reconstructed from
-- what was actually invoiced each period.
CREATE FUNCTION platform_list_invoices_for_analytics()
RETURNS TABLE (
  "tenantId" TEXT,
  currency TEXT,
  amount TEXT,
  "periodStart" TIMESTAMP(3),
  status "InvoiceStatus"
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id, currency, amount::TEXT, period_start, status
  FROM invoices;
$$;

GRANT EXECUTE ON FUNCTION platform_list_invoices_for_analytics() TO africahr_app;
