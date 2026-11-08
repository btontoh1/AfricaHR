import { computeRevenueRetention } from './revenue-retention';
import type { MrrWaterfall } from './mrr-waterfall';

function waterfall(overrides: Partial<MrrWaterfall>): MrrWaterfall {
  return {
    startingMrr: 1000,
    newMrr: 0,
    expansionMrr: 0,
    contractionMrr: 0,
    churnedMrr: 0,
    endingMrr: 1000,
    netNewMrr: 0,
    startingTenantCount: 10,
    newTenantCount: 0,
    churnedTenantCount: 0,
    ...overrides,
  };
}

describe('computeRevenueRetention', () => {
  it('reports 100% for both when nothing changed among existing tenants', () => {
    const result = computeRevenueRetention(waterfall({}));
    expect(result).toEqual({ netRevenueRetentionPercent: 100, grossRevenueRetentionPercent: 100 });
  });

  it('lets net retention exceed 100% when expansion outpaces churn', () => {
    const result = computeRevenueRetention(waterfall({ expansionMrr: 200, churnedMrr: 50 }));
    expect(result.netRevenueRetentionPercent).toBe(115);
    expect(result.grossRevenueRetentionPercent).toBe(95);
  });

  it('never lets gross retention exceed 100% even with expansion', () => {
    const result = computeRevenueRetention(waterfall({ expansionMrr: 500 }));
    expect(result.grossRevenueRetentionPercent).toBe(100);
  });

  it('reflects contraction and churn in both figures', () => {
    const result = computeRevenueRetention(waterfall({ contractionMrr: 100, churnedMrr: 100 }));
    expect(result).toEqual({ netRevenueRetentionPercent: 80, grossRevenueRetentionPercent: 80 });
  });

  it('returns 0 for both when there was nothing to retain', () => {
    const result = computeRevenueRetention(waterfall({ startingMrr: 0 }));
    expect(result).toEqual({ netRevenueRetentionPercent: 0, grossRevenueRetentionPercent: 0 });
  });
});
