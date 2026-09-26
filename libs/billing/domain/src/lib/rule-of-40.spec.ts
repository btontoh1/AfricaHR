import { computeGrowthRatePercent, computeProfitMarginPercent, computeRuleOf40Score } from './rule-of-40';

describe('computeGrowthRatePercent', () => {
  it('computes percent growth', () => {
    expect(computeGrowthRatePercent(100, 150)).toBe(50);
  });

  it('handles a decline as a negative percent', () => {
    expect(computeGrowthRatePercent(100, 80)).toBe(-20);
  });

  it('returns 0 when there was nothing to grow from', () => {
    expect(computeGrowthRatePercent(0, 100)).toBe(0);
  });
});

describe('computeProfitMarginPercent', () => {
  it('computes margin as a percent of revenue', () => {
    expect(computeProfitMarginPercent(1000, 700)).toBe(30);
  });

  it('reports a negative margin when cost exceeds revenue', () => {
    expect(computeProfitMarginPercent(1000, 1500)).toBe(-50);
  });

  it('returns 0 when there was no revenue', () => {
    expect(computeProfitMarginPercent(0, 500)).toBe(0);
  });
});

describe('computeRuleOf40Score', () => {
  it('sums growth rate and profit margin', () => {
    expect(computeRuleOf40Score(25, 15)).toBe(40);
  });

  it('allows a negative score when both are poor', () => {
    expect(computeRuleOf40Score(-10, -5)).toBe(-15);
  });
});
