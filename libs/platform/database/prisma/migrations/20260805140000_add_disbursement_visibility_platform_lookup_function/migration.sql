-- The platform-admin dashboard needs visibility into every payslip
-- disbursement that needs a human's attention across every tenant at
-- once - a stuck PENDING transfer (the reconciliation sweep in
-- PayrollTransferWebhookListener has already had several 15-minute
-- chances to resolve it against Paystack and hasn't) or a FAILED one
-- (which never resolves itself - it just sits there until someone
-- retries it). Until now this only reached a *tenant's* HR/payroll
-- admin via a notification event (PAYROLL_DISBURSEMENT_STUCK_EVENT /
-- PAYROLL_DISBURSEMENT_FAILED_EVENT) - the platform admin who actually
-- owns the Paystack integration had no way to see it.
--
-- Same reasoning as find_stale_pending_payslip_disbursements: "payslips"
-- has a non-nullable tenant_id, so it uses the plain tenant_isolation
-- RLS policy (RLS_CONVENTION.md §2), which has no platform-sentinel
-- branch - withPlatformScope would silently return zero rows here. This
-- is the §5 SECURITY DEFINER exception, joining in exactly the tenant/
-- employee/pay-run context the dashboard needs to display each row
-- without N+1 follow-up lookups.
--
-- Severity (stale vs. critically-stale vs. failed) is classified in
-- TypeScript from updatedAt/disbursementStatus, not here - this function
-- only decides which rows are "in scope" for the wider (stale-pending)
-- threshold, matching the sweep's own two-threshold split.
--
-- net_pay is cast to TEXT rather than returned as DECIMAL for the same
-- reason PlatformBillingRepository's functions cast price/amount
-- columns to TEXT - no existing $queryRaw+Decimal precedent in this repo
-- to confirm which wire representation a raw query would produce.
CREATE FUNCTION platform_list_disbursements_needing_attention(p_stale_pending_before TIMESTAMP(3))
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "tenantName" TEXT,
  "employeeId" TEXT,
  "employeeFirstName" TEXT,
  "employeeLastName" TEXT,
  "payRunId" TEXT,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  currency TEXT,
  "netPay" TEXT,
  "disbursementStatus" "PayslipDisbursementStatus",
  "paystackTransferReference" TEXT,
  "updatedAt" TIMESTAMP(3)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.tenant_id,
    t.name,
    p.employee_id,
    e.first_name,
    e.last_name,
    p.pay_run_id,
    r.period_start,
    r.period_end,
    p.currency,
    p.net_pay::TEXT,
    p.disbursement_status,
    p.paystack_transfer_reference,
    p.updated_at
  FROM payslips p
  JOIN pay_runs r ON r.id = p.pay_run_id
  JOIN employees e ON e.id = p.employee_id
  LEFT JOIN tenants t ON t.id = p.tenant_id
  WHERE p.disbursement_status = 'FAILED'
     OR (p.disbursement_status = 'PENDING' AND p.updated_at < p_stale_pending_before)
  ORDER BY p.updated_at ASC;
$$;

GRANT EXECUTE ON FUNCTION platform_list_disbursements_needing_attention(TIMESTAMP(3)) TO africahr_app;
