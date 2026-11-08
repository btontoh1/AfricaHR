import { isLtvToCacUnhealthy } from './ltv-to-cac-alert-banner';
import type { LtvToCacEntry } from './types';

function entry(overrides: Partial<LtvToCacEntry>): LtvToCacEntry {
  return { currency: 'GHS', month: '2026-02', ltv: 1000, cac: 200, ratio: 5, paybackMonths: 2, ...overrides };
}

describe('isLtvToCacUnhealthy', () => {
  it('is healthy at or above a 3:1 ratio with a reasonable payback', () => {
    expect(isLtvToCacUnhealthy(entry({ ratio: 3 }))).toBe(false);
    expect(isLtvToCacUnhealthy(entry({ ratio: 5 }))).toBe(false);
  });

  it('is unhealthy below a 3:1 ratio', () => {
    expect(isLtvToCacUnhealthy(entry({ ratio: 2.9 }))).toBe(true);
  });

  it('is unhealthy when CAC payback exceeds 12 months, even with a good ratio', () => {
    expect(isLtvToCacUnhealthy(entry({ ratio: 10, paybackMonths: 13 }))).toBe(true);
  });

  it('is healthy at exactly 12 months payback', () => {
    expect(isLtvToCacUnhealthy(entry({ ratio: 10, paybackMonths: 12 }))).toBe(false);
  });

  it('ignores payback when it is null', () => {
    expect(isLtvToCacUnhealthy(entry({ ratio: 10, paybackMonths: null }))).toBe(false);
  });
});
