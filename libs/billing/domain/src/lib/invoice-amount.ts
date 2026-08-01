/**
 * Per-seat billing (see project scoping decision: seat-based, not flat
 * tiers) - the amount due for a period is price-per-employee times the
 * active employee count at the moment the invoice is issued. Rounded to
 * 2 decimal places since money isn't billed in fractions of a cent.
 */
export function calculateInvoiceAmount(pricePerEmployee: number, employeeCount: number): number {
  return Math.round(pricePerEmployee * employeeCount * 100) / 100;
}
