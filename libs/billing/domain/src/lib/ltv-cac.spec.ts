import { computeCac, computeLtv, computeLtvToCacRatio } from './ltv-cac';

describe('computeLtv', () => {
  it('divides ARPU by the monthly churn rate as a fraction', () => {
    expect(computeLtv(100, 5)).toBe(2000);
  });

  it('returns 0 when there is no churn rate to estimate a lifetime from', () => {
    expect(computeLtv(100, 0)).toBe(0);
  });
});

describe('computeCac', () => {
  it('divides acquisition spend by new tenants acquired', () => {
    expect(computeCac(1000, 4)).toBe(250);
  });

  it('returns 0 when no tenants were acquired', () => {
    expect(computeCac(1000, 0)).toBe(0);
  });
});

describe('computeLtvToCacRatio', () => {
  it('computes the ratio', () => {
    expect(computeLtvToCacRatio(2000, 250)).toBe(8);
  });

  it('returns 0 when CAC is unknown', () => {
    expect(computeLtvToCacRatio(2000, 0)).toBe(0);
  });
});
