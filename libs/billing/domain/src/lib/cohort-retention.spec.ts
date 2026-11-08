import { computeCohortRetention } from './cohort-retention';

describe('computeCohortRetention', () => {
  it('computes retention percent by months elapsed since each cohort month', () => {
    const tenantCohortMonths = new Map([
      ['jan1', '2026-01'],
      ['jan2', '2026-01'],
      ['feb1', '2026-02'],
    ]);
    const activeTenantIdsByMonth = new Map([
      ['2026-01', new Set(['jan1', 'jan2'])],
      ['2026-02', new Set(['jan1', 'feb1'])],
      ['2026-03', new Set(['jan1', 'feb1'])],
    ]);
    const monthSequence = ['2026-01', '2026-02', '2026-03'];

    const result = computeCohortRetention(tenantCohortMonths, activeTenantIdsByMonth, monthSequence);

    expect(result).toEqual([
      { cohortMonth: '2026-01', cohortSize: 2, retentionByMonthsElapsed: [100, 50, 50] },
      { cohortMonth: '2026-02', cohortSize: 1, retentionByMonthsElapsed: [100, 100] },
    ]);
  });

  it('returns an empty array with no tenants', () => {
    expect(computeCohortRetention(new Map(), new Map(), [])).toEqual([]);
  });

  it('skips a cohort month outside the provided month sequence', () => {
    const tenantCohortMonths = new Map([['t1', '2025-12']]);
    const result = computeCohortRetention(tenantCohortMonths, new Map(), ['2026-01']);
    expect(result).toEqual([]);
  });
});
