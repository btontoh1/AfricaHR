-- The Paystack Fees admin page shows how many active employees, platform-
-- wide, would be charged a given currency+channel's real transfer cost -
-- "employees" and "employee_payment_methods" both have non-nullable
-- tenant_id and use the plain tenant_isolation RLS policy
-- (RLS_CONVENTION.md §2), which has no platform-sentinel branch, so
-- withPlatformScope would silently return zero rows here. Same §5
-- SECURITY DEFINER exception as platform_active_employee_counts, joined
-- against the employee's own payment method instead of grouped by tenant.
-- Uses the identical "active" definition (deleted_at IS NULL AND
-- employment_status != 'TERMINATED') as platform_active_employee_counts.
-- Employees with no currency set, or no payment method on file yet,
-- contribute to neither a currency nor a channel and are excluded - same
-- "never blend currencies" posture as every other platform money report.
CREATE FUNCTION platform_employee_counts_by_currency_and_channel()
RETURNS TABLE (currency TEXT, channel "PaymentMethodType", "employeeCount" TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.currency, pm.type, count(*)::TEXT
  FROM employees e
  JOIN employee_payment_methods pm ON pm.employee_id = e.id
  WHERE e.deleted_at IS NULL AND e.employment_status != 'TERMINATED' AND e.currency IS NOT NULL
  GROUP BY e.currency, pm.type;
$$;

GRANT EXECUTE ON FUNCTION platform_employee_counts_by_currency_and_channel() TO africahr_app;
