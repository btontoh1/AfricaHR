/**
 * Per-seat billing, with an optional flat-rate layer on top (see project
 * scoping decision: originally seat-based only, extended to support a
 * fixed per-period charge for a tenant on a flat-rate plan). The amount
 * due for a period is:
 *
 *   flatFeeAmount + pricePerEmployee × max(0, employeeCount - includedEmployeeCount)
 *
 * flatFeeAmount and includedEmployeeCount both default to 0, which
 * collapses this back to pure per-seat billing (pricePerEmployee ×
 * employeeCount) for every tenant that predates this field or was never
 * put on a flat-rate plan. Rounded to 2 decimal places since money isn't
 * billed in fractions of a cent.
 */
export function calculateInvoiceAmount(
  pricePerEmployee: number,
  employeeCount: number,
  flatFeeAmount = 0,
  includedEmployeeCount = 0,
): number {
  const billableEmployeeCount = Math.max(0, employeeCount - includedEmployeeCount);
  return Math.round((flatFeeAmount + pricePerEmployee * billableEmployeeCount) * 100) / 100;
}
