import { computeMrrWaterfall } from './mrr-waterfall';

describe('computeMrrWaterfall', () => {
  it('classifies new, expansion, contraction, and churned tenants', () => {
    const previous = [
      { tenantId: 'stable', amount: 100 },
      { tenantId: 'expanding', amount: 100 },
      { tenantId: 'contracting', amount: 100 },
      { tenantId: 'churning', amount: 100 },
    ];
    const current = [
      { tenantId: 'stable', amount: 100 },
      { tenantId: 'expanding', amount: 150 },
      { tenantId: 'contracting', amount: 60 },
      { tenantId: 'brandNew', amount: 80 },
    ];

    const result = computeMrrWaterfall(previous, current);

    expect(result).toEqual({
      startingMrr: 400,
      newMrr: 80,
      expansionMrr: 50,
      contractionMrr: 40,
      churnedMrr: 100,
      endingMrr: 390,
      netNewMrr: -10,
      startingTenantCount: 4,
      newTenantCount: 1,
      churnedTenantCount: 1,
    });
  });

  it('returns all zeros when both periods are empty', () => {
    expect(computeMrrWaterfall([], [])).toEqual({
      startingMrr: 0,
      newMrr: 0,
      expansionMrr: 0,
      contractionMrr: 0,
      churnedMrr: 0,
      endingMrr: 0,
      netNewMrr: 0,
      startingTenantCount: 0,
      newTenantCount: 0,
      churnedTenantCount: 0,
    });
  });

  it('treats an unchanged charge as neither expansion nor contraction', () => {
    const result = computeMrrWaterfall([{ tenantId: 't1', amount: 100 }], [{ tenantId: 't1', amount: 100 }]);

    expect(result.expansionMrr).toBe(0);
    expect(result.contractionMrr).toBe(0);
    expect(result.netNewMrr).toBe(0);
  });

  it('endingMrr - startingMrr equals netNewMrr', () => {
    const previous = [
      { tenantId: 'a', amount: 100 },
      { tenantId: 'b', amount: 200 },
    ];
    const current = [
      { tenantId: 'a', amount: 120 },
      { tenantId: 'c', amount: 50 },
    ];

    const result = computeMrrWaterfall(previous, current);

    expect(result.endingMrr - result.startingMrr).toBeCloseTo(result.netNewMrr, 5);
  });
});
