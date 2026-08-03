-- Backs the disbursement reconciliation sweep
-- (PayrollTransferWebhookListener's @Cron method), which finds payslips
-- stuck in PENDING (the transfer.success/transfer.failed webhook was
-- never delivered) across every tenant and re-checks each one directly
-- against Paystack's "Verify Transfer" endpoint. Same
-- "resolve before any single tenant is known" shape as
-- find_payslip_by_paystack_transfer_reference_across_tenants - a
-- scheduled sweep has no tenant context to start from either, so this
-- is the same SECURITY DEFINER pattern applied to a bulk scan instead of
-- a single lookup.
CREATE FUNCTION find_stale_pending_payslip_disbursements(p_older_than TIMESTAMP(3))
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "paystackTransferReference" TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, paystack_transfer_reference
  FROM payslips
  WHERE disbursement_status = 'PENDING'
    AND paystack_transfer_reference IS NOT NULL
    AND updated_at < p_older_than;
$$;

GRANT EXECUTE ON FUNCTION find_stale_pending_payslip_disbursements(TIMESTAMP(3)) TO africahr_app;
