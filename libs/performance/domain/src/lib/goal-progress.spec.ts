import { isValidProgressPercent } from './goal-progress';

describe('isValidProgressPercent', () => {
  it('accepts integers from 0 to 100', () => {
    expect(isValidProgressPercent(0)).toBe(true);
    expect(isValidProgressPercent(50)).toBe(true);
    expect(isValidProgressPercent(100)).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(isValidProgressPercent(-1)).toBe(false);
    expect(isValidProgressPercent(101)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidProgressPercent(50.5)).toBe(false);
  });
});
