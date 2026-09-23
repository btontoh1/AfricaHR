import { computeCashFlow } from './compute-cash-flow';

describe('computeCashFlow', () => {
  it('nets debits (cash in) against credits (cash out)', () => {
    expect(
      computeCashFlow([
        { debit: 5000, credit: 0 },
        { debit: 0, credit: 3200 },
        { debit: 800, credit: 0 },
      ]),
    ).toEqual({ netCashChange: 2600 });
  });

  it('returns zero net change for no activity', () => {
    expect(computeCashFlow([])).toEqual({ netCashChange: 0 });
  });

  it('reports a net cash outflow as negative', () => {
    expect(computeCashFlow([{ debit: 100, credit: 0 }, { debit: 0, credit: 900 }])).toEqual({
      netCashChange: -800,
    });
  });
});
