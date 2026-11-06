import { computeMagicNumber } from './magic-number';

describe('computeMagicNumber', () => {
  it('divides net-new MRR by the prior month acquisition cost', () => {
    expect(computeMagicNumber(750, 1000)).toBe(0.75);
  });

  it('allows a negative value when MRR contracted', () => {
    expect(computeMagicNumber(-200, 1000)).toBe(-0.2);
  });

  it('returns null when no acquisition cost was entered for the prior month', () => {
    expect(computeMagicNumber(750, 0)).toBeNull();
  });
});
