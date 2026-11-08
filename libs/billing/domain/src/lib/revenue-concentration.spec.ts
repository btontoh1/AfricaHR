import { computeRevenueConcentration } from './revenue-concentration';

describe('computeRevenueConcentration', () => {
  it('ranks tenants by amount and computes each share', () => {
    const result = computeRevenueConcentration([
      { tenantId: 't1', tenantName: 'Alpha', amount: 500 },
      { tenantId: 't2', tenantName: 'Beta', amount: 300 },
      { tenantId: 't3', tenantName: 'Gamma', amount: 200 },
    ]);

    expect(result.topTenants).toEqual([
      { tenantId: 't1', tenantName: 'Alpha', amount: 500, sharePercent: 50 },
      { tenantId: 't2', tenantName: 'Beta', amount: 300, sharePercent: 30 },
      { tenantId: 't3', tenantName: 'Gamma', amount: 200, sharePercent: 20 },
    ]);
    expect(result.topTenantsSharePercent).toBe(100);
  });

  it('limits to topN tenants and sums their combined share', () => {
    const charges = [
      { tenantId: 't1', tenantName: 'A', amount: 400 },
      { tenantId: 't2', tenantName: 'B', amount: 300 },
      { tenantId: 't3', tenantName: 'C', amount: 200 },
      { tenantId: 't4', tenantName: 'D', amount: 100 },
    ];

    const result = computeRevenueConcentration(charges, 2);

    expect(result.topTenants.map((t) => t.tenantId)).toEqual(['t1', 't2']);
    expect(result.topTenantsSharePercent).toBe(70);
  });

  it('returns 0% shares when there is no revenue', () => {
    const result = computeRevenueConcentration([]);

    expect(result.topTenants).toEqual([]);
    expect(result.topTenantsSharePercent).toBe(0);
  });
});
