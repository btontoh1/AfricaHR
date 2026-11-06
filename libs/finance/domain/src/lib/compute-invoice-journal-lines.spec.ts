import { GlAccountCode } from './default-chart-of-accounts';
import { computeInvoiceSentJournalLines, computeInvoicePaidJournalLines } from './compute-invoice-journal-lines';

describe('computeInvoiceSentJournalLines', () => {
  it('posts AR/Revenue/Tax Payable when the invoice has sales tax', () => {
    const lines = computeInvoiceSentJournalLines({ subtotal: 1000, taxAmount: 150, total: 1150 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, debit: 1150, credit: 0 },
      { accountCode: GlAccountCode.REVENUE, debit: 0, credit: 1000 },
      { accountCode: GlAccountCode.TAX_PAYABLE, debit: 0, credit: 150 },
    ]);
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    expect(debits).toBe(credits);
  });

  it('omits the Tax Payable line when the invoice has no sales tax', () => {
    const lines = computeInvoiceSentJournalLines({ subtotal: 500, taxAmount: 0, total: 500 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, debit: 500, credit: 0 },
      { accountCode: GlAccountCode.REVENUE, debit: 0, credit: 500 },
    ]);
  });
});

describe('computeInvoicePaidJournalLines', () => {
  it('posts Cash/AR at the invoice total', () => {
    const lines = computeInvoicePaidJournalLines({ total: 1150 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 1150, credit: 0 },
      { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, debit: 0, credit: 1150 },
    ]);
  });
});
