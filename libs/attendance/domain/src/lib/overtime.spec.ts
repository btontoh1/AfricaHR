import { computeOvertimeHours } from './overtime';

describe('computeOvertimeHours', () => {
  it('returns 0 when hours worked is within the standard threshold', () => {
    expect(computeOvertimeHours(8, 8)).toBe(0);
    expect(computeOvertimeHours(6, 8)).toBe(0);
  });

  it('returns the excess when hours worked exceeds the threshold', () => {
    expect(computeOvertimeHours(9.5, 8)).toBe(1.5);
  });

  it('works for any threshold, not a fixed 8 hours', () => {
    expect(computeOvertimeHours(7, 6)).toBe(1);
  });
});
