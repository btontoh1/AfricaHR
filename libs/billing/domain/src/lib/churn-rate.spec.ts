import { computeChurnRates } from './churn-rate';

describe('computeChurnRates', () => {
  it('computes logo and revenue churn as percentages', () => {
    expect(computeChurnRates(10, 2, 1000, 150)).toEqual({
      logoChurnRatePercent: 20,
      revenueChurnRatePercent: 15,
    });
  });

  it('returns 0 for logo churn when there were no previous tenants', () => {
    expect(computeChurnRates(0, 0, 0, 0).logoChurnRatePercent).toBe(0);
  });

  it('returns 0 for revenue churn when there was no starting MRR', () => {
    expect(computeChurnRates(5, 0, 0, 0).revenueChurnRatePercent).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = computeChurnRates(3, 1, 300, 100);
    expect(result.logoChurnRatePercent).toBeCloseTo(33.33, 2);
    expect(result.revenueChurnRatePercent).toBeCloseTo(33.33, 2);
  });
});
