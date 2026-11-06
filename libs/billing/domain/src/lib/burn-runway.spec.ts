import { computeBurnMultiple, computeNetBurn, computeRunwayMonths } from './burn-runway';

describe('computeNetBurn', () => {
  it('is positive when cost exceeds revenue', () => {
    expect(computeNetBurn(1000, 1500)).toBe(500);
  });

  it('is zero or negative when profitable', () => {
    expect(computeNetBurn(1500, 1000)).toBe(-500);
  });
});

describe('computeRunwayMonths', () => {
  it('divides cash balance by net burn', () => {
    expect(computeRunwayMonths(10000, 2000)).toBe(5);
  });

  it('returns null when not burning cash', () => {
    expect(computeRunwayMonths(10000, 0)).toBeNull();
    expect(computeRunwayMonths(10000, -500)).toBeNull();
  });
});

describe('computeBurnMultiple', () => {
  it('divides net burn by net-new MRR', () => {
    expect(computeBurnMultiple(2000, 1000)).toBe(2);
  });

  it('returns 0 when profitable and growing', () => {
    expect(computeBurnMultiple(-500, 1000)).toBe(0);
  });

  it('returns null when there was no growth to divide by', () => {
    expect(computeBurnMultiple(2000, 0)).toBeNull();
    expect(computeBurnMultiple(2000, -100)).toBeNull();
  });
});
