export interface InvoiceLineItemAmountInput {
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/**
 * Rounds at each stage (subtotal, tax, total) to 2 decimal places - money
 * isn't billed in fractions of a cent, same reasoning as
 * calculateInvoiceAmount in billing-domain. Stored on CustomerInvoice at
 * write time (see CustomerInvoiceService) rather than recomputed on every
 * read, so a later tax-rate or line-item edit never silently rewrites a
 * Sent/Paid invoice's history.
 */
export function computeInvoiceTotals(
  lineItems: InvoiceLineItemAmountInput[],
  taxRatePercent: number,
): InvoiceTotals {
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const taxAmount = round2(subtotal * (taxRatePercent / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
