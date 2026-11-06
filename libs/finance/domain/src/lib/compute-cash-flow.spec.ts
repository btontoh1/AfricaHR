import { computeCashFlow } from './compute-cash-flow';

describe('computeCashFlow', () => {
  it('nets debits (cash in) against credits (cash out)', () => {
    expect(
      computeCashFlow([
        { currency: 'GHS', debit: 5000, credit: 0 },
        { currency: 'GHS', debit: 0, credit: 3200 },
        { currency: 'GHS', debit: 800, credit: 0 },
      ]),
    ).toEqual([{ currency: 'GHS', netCashChange: 2600 }]);
  });

  it('returns an empty array for no activity', () => {
    expect(computeCashFlow([])).toEqual([]);
  });

  it('reports a net cash outflow as negative', () => {
    expect(
      computeCashFlow([{ currency: 'GHS', debit: 100, credit: 0 }, { currency: 'GHS', debit: 0, credit: 900 }]),
    ).toEqual([{ currency: 'GHS', netCashChange: -800 }]);
  });

  it('never blends currencies together', () => {
    const report = computeCashFlow([
      { currency: 'GHS', debit: 1000, credit: 0 },
      { currency: 'NGN', debit: 0, credit: 40000 },
    ]);
    expect(report).toEqual([
      { currency: 'GHS', netCashChange: 1000 },
      { currency: 'NGN', netCashChange: -40000 },
    ]);
  });
});
