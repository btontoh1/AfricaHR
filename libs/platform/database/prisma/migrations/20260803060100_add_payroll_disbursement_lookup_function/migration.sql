-- The Paystack transfer webhook identifies a payslip only by its transfer
-- reference (paystack_transfer_reference), globally unique but with no
-- tenant context attached to the webhook payload - the same
-- "resolve before any tenant is known" shape as
-- find_invoice_by_paystack_reference_across_tenants, applied to payslips
-- instead of invoices. Only id/tenantId/disbursementStatus are returned -
-- the caller re-reads the row through the normal tenant-scoped
-- PayslipRepository once tenantId is known, then writes through that
-- (same two-step pattern InvoiceService.handlePaystackWebhook already
-- uses), so this function doesn't need to expose the full row.
CREATE FUNCTION find_payslip_by_paystack_transfer_reference_across_tenants(p_reference TEXT)
RETURNS TABLE (
  id TEXT,
  "tenantId" TEXT,
  "disbursementStatus" "PayslipDisbursementStatus"
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, disbursement_status
  FROM payslips
  WHERE paystack_transfer_reference = p_reference;
$$;

GRANT EXECUTE ON FUNCTION find_payslip_by_paystack_transfer_reference_across_tenants(TEXT) TO africahr_app;
