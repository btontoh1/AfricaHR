import { isBalancedEntry } from './validate-balanced-entry';

describe('isBalancedEntry', () => {
  it('accepts a simple balanced two-line entry', () => {
    expect(isBalancedEntry([{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }])).toBe(true);
  });

  it('accepts a balanced entry with multiple lines on each side', () => {
    expect(
      isBalancedEntry([
        { debit: 60, credit: 0 },
        { debit: 40, credit: 0 },
        { debit: 0, credit: 100 },
      ]),
    ).toBe(true);
  });

  it('rejects an entry where debits and credits differ by a full cent', () => {
    expect(isBalancedEntry([{ debit: 100, credit: 0 }, { debit: 0, credit: 99.99 }])).toBe(false);
  });

  it('tolerates sub-cent floating point summation noise', () => {
    const lines = [{ debit: 0.1, credit: 0 }, { debit: 0.2, credit: 0 }, { debit: 0, credit: 0.3 }];
    expect(isBalancedEntry(lines)).toBe(true);
  });

  it('rejects an empty entry as balanced only when both sides are zero (vacuously true)', () => {
    expect(isBalancedEntry([])).toBe(true);
  });
});
