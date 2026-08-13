import { z } from 'zod';

export const invoiceLineItemFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.string().min(1, 'Required'),
  unitPrice: z.string().min(1, 'Required'),
});

export type InvoiceLineItemFormValues = z.infer<typeof invoiceLineItemFormSchema>;

export const invoiceFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  customerId: z.string().min(1, 'Customer is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  taxRate: z.string().optional().or(z.literal('')),
  lineItems: z.array(invoiceLineItemFormSchema).min(1, 'Add at least one line item'),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export interface InvoiceTotalsPreview {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/** Client-side preview only - the backend recomputes and stores the
 * authoritative totals (see CustomerInvoiceService), so this never needs to
 * match byte-for-byte, just give the person filling the form a live number. */
export function previewInvoiceTotals(lineItems: InvoiceLineItemFormValues[], taxRatePercent: string): InvoiceTotalsPreview {
  const subtotal = lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const taxRate = Number(taxRatePercent) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}
