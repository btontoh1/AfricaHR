import { GlAccountCode } from './default-chart-of-accounts';
import { computeExpenseRecordedJournalLines, computeExpenseReimbursedJournalLines } from './compute-expense-journal-lines';

describe('computeExpenseRecordedJournalLines', () => {
  it('credits Cash and Bank directly for a COMPANY-paid expense', () => {
    const lines = computeExpenseRecordedJournalLines({ amount: 150, paidBy: 'COMPANY' });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.GENERAL_EXPENSE, debit: 150, credit: 0 },
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: 150 },
    ]);
  });

  it('credits Expense Reimbursements Payable for an EMPLOYEE-paid expense', () => {
    const lines = computeExpenseRecordedJournalLines({ amount: 150, paidBy: 'EMPLOYEE' });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.GENERAL_EXPENSE, debit: 150, credit: 0 },
      { accountCode: GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE, debit: 0, credit: 150 },
    ]);
  });

  it('always balances', () => {
    for (const paidBy of ['COMPANY', 'EMPLOYEE'] as const) {
      const lines = computeExpenseRecordedJournalLines({ amount: 275.5, paidBy });
      const debits = lines.reduce((sum, line) => sum + line.debit, 0);
      const credits = lines.reduce((sum, line) => sum + line.credit, 0);
      expect(debits).toBe(credits);
    }
  });
});

describe('computeExpenseReimbursedJournalLines', () => {
  it('posts Expense Reimbursements Payable/Cash at the expense amount', () => {
    const lines = computeExpenseReimbursedJournalLines({ amount: 150 });
    expect(lines).toEqual([
      { accountCode: GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE, debit: 150, credit: 0 },
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: 150 },
    ]);
    const debits = lines.reduce((sum, line) => sum + line.debit, 0);
    const credits = lines.reduce((sum, line) => sum + line.credit, 0);
    expect(debits).toBe(credits);
  });
});
