import { computeReversalJournalLines } from './compute-reversal-journal-lines';

describe('computeReversalJournalLines', () => {
  it('swaps debit and credit on every line, keeping the same account', () => {
    const reversed = computeReversalJournalLines([
      { accountId: 'acc-expense', debit: 500, credit: 0 },
      { accountId: 'acc-cash', debit: 0, credit: 500 },
    ]);
    expect(reversed).toEqual([
      { accountId: 'acc-expense', debit: 0, credit: 500 },
      { accountId: 'acc-cash', debit: 500, credit: 0 },
    ]);
  });

  it('always produces a balanced result when the input was balanced', () => {
    const lines = [
      { accountId: 'a', debit: 1200, credit: 0 },
      { accountId: 'b', debit: 0, credit: 1000 },
      { accountId: 'c', debit: 0, credit: 200 },
    ];
    const reversed = computeReversalJournalLines(lines);
    const totalDebit = reversed.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = reversed.reduce((sum, l) => sum + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(1200);
  });

  it('returns an empty array for no lines', () => {
    expect(computeReversalJournalLines([])).toEqual([]);
  });
});
