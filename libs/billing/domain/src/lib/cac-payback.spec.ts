import { computeCacPaybackMonths } from './cac-payback';

describe('computeCacPaybackMonths', () => {
  it('divides CAC by ARPU', () => {
    expect(computeCacPaybackMonths(300, 100)).toBe(3);
  });

  it('rounds to one decimal place', () => {
    expect(computeCacPaybackMonths(100, 30)).toBe(3.3);
  });

  it('returns null when there is no revenue to recoup CAC from', () => {
    expect(computeCacPaybackMonths(300, 0)).toBeNull();
  });
});
