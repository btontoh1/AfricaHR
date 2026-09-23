import { GlAccountCode } from './default-chart-of-accounts';
import { JournalLineAmount } from './journal-line-amount';

export interface InvoiceSentAmounts {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/**
 * Dr Accounts Receivable (total) / Cr Revenue (subtotal) / Cr Tax Payable
 * (taxAmount, omitted when zero - most invoices carry no sales tax).
 */
export function computeInvoiceSentJournalLines(invoice: InvoiceSentAmounts): JournalLineAmount[] {
  const lines: JournalLineAmount[] = [
    { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, debit: invoice.total, credit: 0 },
    { accountCode: GlAccountCode.REVENUE, debit: 0, credit: invoice.subtotal },
  ];
  if (invoice.taxAmount > 0) {
    lines.push({ accountCode: GlAccountCode.TAX_PAYABLE, debit: 0, credit: invoice.taxAmount });
  }
  return lines;
}

export interface InvoicePaidAmounts {
  total: number;
}

/** Dr Cash and Bank / Cr Accounts Receivable, both at the invoice's total. */
export function computeInvoicePaidJournalLines(invoice: InvoicePaidAmounts): JournalLineAmount[] {
  return [
    { accountCode: GlAccountCode.CASH_AND_BANK, debit: invoice.total, credit: 0 },
    { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, debit: 0, credit: invoice.total },
  ];
}
