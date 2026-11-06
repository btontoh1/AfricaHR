export interface BillLineItemAmountInput {
  quantity: number;
  unitPrice: number;
}

export interface BillTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/**
 * Rounds at each stage (subtotal, tax, total) to 2 decimal places, same
 * reasoning and shape as invoicing-domain's computeInvoiceTotals - stored on
 * VendorBill at write time rather than recomputed on every read, so a later
 * tax-rate or line-item edit never silently rewrites an Approved/Paid bill's
 * history.
 */
export function computeBillTotals(lineItems: BillLineItemAmountInput[], taxRatePercent: number): BillTotals {
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const taxAmount = round2(subtotal * (taxRatePercent / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
