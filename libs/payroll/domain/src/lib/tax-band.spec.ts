import { calculatePayeTax, TaxBand } from './tax-band';

// A simple 3-band table for testing the calculator's mechanics — not real
// GRA figures (those live in seeded reference data, never in code/tests).
const bands: TaxBand[] = [
  { order: 1, lowerBound: 0, upperBound: 100, rate: 0 },
  { order: 2, lowerBound: 100, upperBound: 500, rate: 0.1 },
  { order: 3, lowerBound: 500, upperBound: null, rate: 0.25 },
];

describe('calculatePayeTax', () => {
  it('returns 0 for income within the free band', () => {
    expect(calculatePayeTax(100, bands)).toBe(0);
  });

  it('returns 0 for zero or negative income', () => {
    expect(calculatePayeTax(0, bands)).toBe(0);
    expect(calculatePayeTax(-50, bands)).toBe(0);
  });

  it('taxes only the slice of income within a single band above the free band', () => {
    // 300 taxable: first 100 free, next 200 at 10% = 20
    expect(calculatePayeTax(300, bands)).toBe(20);
  });

  it('taxes across multiple bands progressively', () => {
    // 700 taxable: 100 free + 400 at 10% (=40) + 200 at 25% (=50) = 90
    expect(calculatePayeTax(700, bands)).toBe(90);
  });

  it('applies the unbounded top band rate to everything above its lower bound', () => {
    // 1500 taxable: 100 free + 400*0.1 (=40) + 1000*0.25 (=250) = 290
    expect(calculatePayeTax(1500, bands)).toBe(290);
  });

  it('is exact at a band boundary', () => {
    // exactly 500: 100 free + 400*0.1 = 40, nothing in the top band yet
    expect(calculatePayeTax(500, bands)).toBe(40);
  });

  it('does not depend on band input order', () => {
    const shuffled = [bands[2], bands[0], bands[1]];
    expect(calculatePayeTax(700, shuffled)).toBe(90);
  });

  it('rounds to 2 decimal places', () => {
    const oddRateBands: TaxBand[] = [{ order: 1, lowerBound: 0, upperBound: null, rate: 1 / 3 }];
    expect(calculatePayeTax(100, oddRateBands)).toBe(33.33);
  });
});
