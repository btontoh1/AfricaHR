import { isEligibleForNigeriaNhis } from './nigeria-nhis-eligibility';

describe('isEligibleForNigeriaNhis', () => {
  it('is eligible above the minimum basic salary', () => {
    expect(isEligibleForNigeriaNhis(50_000)).toBe(true);
  });

  it('is eligible exactly at the minimum basic salary', () => {
    expect(isEligibleForNigeriaNhis(30_000)).toBe(true);
  });

  it('is not eligible below the minimum basic salary', () => {
    expect(isEligibleForNigeriaNhis(29_999)).toBe(false);
  });
});
