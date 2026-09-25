import {
  computeClearedBalance,
  computeReconciliationDifference,
  isReconciliationBalanced,
} from './compute-bank-reconciliation';

describe('computeClearedBalance', () => {
  it('nets debits and credits across every cleared line', () => {
    const balance = computeClearedBalance([
      { debit: 5000, credit: 0 },
      { debit: 0, credit: 1200 },
      { debit: 300, credit: 0 },
    ]);

    expect(balance).toBe(4100);
  });

  it('returns 0 for no cleared lines', () => {
    expect(computeClearedBalance([])).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const balance = computeClearedBalance([{ debit: 10.005, credit: 0 }]);
    expect(balance).toBe(10.01);
  });
});

describe('computeReconciliationDifference', () => {
  it('returns 0 when the cleared balance matches the statement', () => {
    expect(computeReconciliationDifference(5000, 5000)).toBe(0);
  });

  it('returns a positive difference when cleared balance exceeds the statement', () => {
    expect(computeReconciliationDifference(5200, 5000)).toBe(200);
  });

  it('returns a negative difference when cleared balance is short of the statement', () => {
    expect(computeReconciliationDifference(4800, 5000)).toBe(-200);
  });
});

describe('isReconciliationBalanced', () => {
  it('is true when cleared balance exactly matches the statement ending balance', () => {
    expect(isReconciliationBalanced(5000, 5000)).toBe(true);
  });

  it('is false for any non-zero difference', () => {
    expect(isReconciliationBalanced(5000.01, 5000)).toBe(false);
    expect(isReconciliationBalanced(4999.99, 5000)).toBe(false);
  });
});
