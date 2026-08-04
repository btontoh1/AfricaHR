import { calculateKenyaShif } from './kenya-shif';

describe('calculateKenyaShif', () => {
  it('applies the flat rate once gross pay is comfortably above the floor', () => {
    expect(calculateKenyaShif(100_000, 0.0275)).toBe(2750);
  });

  it('floors at the KES 300 minimum for gross pay below the floor threshold', () => {
    expect(calculateKenyaShif(5_000, 0.0275)).toBe(300);
  });

  it('returns exactly the minimum right at the threshold where the rate would equal it', () => {
    // 300 / 0.0275 = 10,909.09...
    expect(calculateKenyaShif(10_909.09, 0.0275)).toBe(300);
  });

  it('returns 0 for zero or negative gross pay, rather than charging the floor on no income', () => {
    expect(calculateKenyaShif(0, 0.0275)).toBe(0);
    expect(calculateKenyaShif(-100, 0.0275)).toBe(0);
  });
});
