import { GlAccountCode } from './default-chart-of-accounts';
import {
  computeVendorBillApprovedJournalLines,
  computeVendorPaymentJournalLines,
} from './compute-vendor-bill-journal-lines';

describe('computeVendorBillApprovedJournalLines', () => {
  it('posts General Expense/Accounts Payable at the bill total, tax included', () => {
    const lines = computeVendorBillApprovedJournalLines({ total: 1150 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.GENERAL_EXPENSE, debit: 1150, credit: 0 },
      { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 0, credit: 1150 },
    ]);
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    expect(debits).toBe(credits);
  });
});

describe('computeVendorPaymentJournalLines', () => {
  it('posts Accounts Payable/Cash at the payment amount', () => {
    const lines = computeVendorPaymentJournalLines({ amount: 1150 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 1150, credit: 0 },
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: 1150 },
    ]);
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    expect(debits).toBe(credits);
  });
});
