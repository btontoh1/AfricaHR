-- The reconciliation sweep (PayrollTransferWebhookListener.
-- reconcileStalePendingDisbursements) now needs each stale payslip's
-- currency to pick the right Paystack account to verify it against
-- (PaystackTransferClientRegistry.forCurrency) - see the multi-country
-- Paystack support this migration is part of. Postgres won't let
-- CREATE OR REPLACE FUNCTION change a function's return type, so this
-- drops and recreates it rather than replacing it in place.
DROP FUNCTION IF EXISTS find_stale_pending_payslip_disbursements(TIMESTAMP(3));

CREATE FUNCTION find_stale_pending_payslip_disbursements(p_older_than TIMESTAMP(3))
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "paystackTransferReference" TEXT,
  currency TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, paystack_transfer_reference, currency
  FROM payslips
  WHERE disbursement_status = 'PENDING'
    AND paystack_transfer_reference IS NOT NULL
    AND updated_at < p_older_than;
$$;

GRANT EXECUTE ON FUNCTION find_stale_pending_payslip_disbursements(TIMESTAMP(3)) TO africahr_app;
