import { isValidRating } from './rating';

describe('isValidRating', () => {
  it('accepts integers from 1 to 5', () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(5)).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidRating(3.5)).toBe(false);
  });
});
