import { calculatePercentage } from './percentage';

describe('calculatePercentage', () => {
  it('computes a plain part-over-whole percentage', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33.33);
  });

  it('returns 0 rather than NaN/Infinity when whole is 0', () => {
    expect(calculatePercentage(5, 0)).toBe(0);
  });

  it('returns 0 for a negative whole', () => {
    expect(calculatePercentage(5, -10)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculatePercentage(2, 7)).toBe(28.57);
  });
});
