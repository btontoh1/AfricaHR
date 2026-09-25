import {
  computeDepreciationForPeriod,
  computeMonthlyDepreciation,
  depreciationDayOfMonth,
  isFullyDepreciated,
} from './compute-fixed-asset-depreciation';

describe('computeMonthlyDepreciation', () => {
  it('divides the depreciable base evenly across the useful life', () => {
    expect(computeMonthlyDepreciation(12000, 0, 24)).toBe(500);
  });

  it('subtracts salvage value from the depreciable base', () => {
    expect(computeMonthlyDepreciation(12000, 2400, 24)).toBe(400);
  });

  it('rounds to 2dp', () => {
    expect(computeMonthlyDepreciation(1000, 0, 3)).toBe(333.33);
  });
});

describe('computeDepreciationForPeriod', () => {
  it('returns the plain monthly amount when well short of the depreciable base', () => {
    expect(computeDepreciationForPeriod(12000, 0, 24, 500)).toBe(500);
  });

  it('caps at the remaining depreciable base rather than the plain monthly amount', () => {
    // monthly is 33.33, but only 33.32 remains - posting the plain monthly
    // amount here would overshoot the depreciable base by a cent.
    expect(computeDepreciationForPeriod(100, 0, 3, 66.68)).toBe(33.32);
  });

  it('returns 0 once fully depreciated', () => {
    expect(computeDepreciationForPeriod(12000, 0, 24, 12000)).toBe(0);
  });

  it('returns 0 if accumulated depreciation has already overshot somehow', () => {
    expect(computeDepreciationForPeriod(12000, 0, 24, 12500)).toBe(0);
  });
});

describe('isFullyDepreciated', () => {
  it('is false while depreciable base remains', () => {
    expect(isFullyDepreciated(12000, 0, 11500)).toBe(false);
  });

  it('is true once accumulated depreciation reaches the depreciable base', () => {
    expect(isFullyDepreciated(12000, 0, 12000)).toBe(true);
  });

  it('accounts for salvage value', () => {
    expect(isFullyDepreciated(12000, 2000, 10000)).toBe(true);
    expect(isFullyDepreciated(12000, 2000, 9999)).toBe(false);
  });
});

describe('depreciationDayOfMonth', () => {
  it('uses the acquisition date day when 28 or earlier', () => {
    expect(depreciationDayOfMonth(new Date('2026-03-15'))).toBe(15);
  });

  it('caps at 28 for a later day', () => {
    expect(depreciationDayOfMonth(new Date('2026-03-31'))).toBe(28);
  });
});
