import { GlAccountCode } from './default-chart-of-accounts';
import { JournalLineAmount } from './journal-line-amount';

export interface VendorBillApprovedAmounts {
  total: number;
}

/**
 * Dr General Expense (total) / Cr Accounts Payable (total). Unlike
 * computeInvoiceSentJournalLines, tax isn't split into its own line - there's
 * no "input tax recoverable" account in this minimal chart (see
 * default-chart-of-accounts.ts), so a bill's tax is simply part of its
 * expense, same as how the whole bill posts to one fixed GENERAL_EXPENSE
 * account regardless of what it's actually for.
 */
export function computeVendorBillApprovedJournalLines(bill: VendorBillApprovedAmounts): JournalLineAmount[] {
  return [
    { accountCode: GlAccountCode.GENERAL_EXPENSE, debit: bill.total, credit: 0 },
    { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 0, credit: bill.total },
  ];
}

export interface VendorPaymentJournalAmounts {
  amount: number;
}

/** Dr Accounts Payable / Cr Cash and Bank, both at the payment's combined
 * amount - one payment can settle several bills (or only part of one), so
 * this is never keyed to any single bill's total. See
 * VendorPaymentService.create. */
export function computeVendorPaymentJournalLines(payment: VendorPaymentJournalAmounts): JournalLineAmount[] {
  return [
    { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: payment.amount, credit: 0 },
    { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: payment.amount },
  ];
}
