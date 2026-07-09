import { countWorkingDays } from './working-days';

describe('countWorkingDays', () => {
  it('counts a single weekday as 1', () => {
    expect(countWorkingDays(new Date('2026-01-05T00:00:00Z'), new Date('2026-01-05T00:00:00Z'))).toBe(1);
  });

  it('counts a single weekend day as 0', () => {
    expect(countWorkingDays(new Date('2026-01-03T00:00:00Z'), new Date('2026-01-03T00:00:00Z'))).toBe(0);
  });

  it('counts Mon-Fri as 5', () => {
    expect(countWorkingDays(new Date('2026-01-05T00:00:00Z'), new Date('2026-01-09T00:00:00Z'))).toBe(5);
  });

  it('excludes the weekend when the range spans a full calendar week', () => {
    // Mon 2026-01-05 through Sun 2026-01-11 = 7 calendar days, 5 working days
    expect(countWorkingDays(new Date('2026-01-05T00:00:00Z'), new Date('2026-01-11T00:00:00Z'))).toBe(5);
  });

  it('counts across a week boundary', () => {
    // Fri 2026-01-09 through Mon 2026-01-12 = Fri, Mon (Sat/Sun excluded) = 2
    expect(countWorkingDays(new Date('2026-01-09T00:00:00Z'), new Date('2026-01-12T00:00:00Z'))).toBe(2);
  });

  it('throws when endDate is before startDate', () => {
    expect(() =>
      countWorkingDays(new Date('2026-01-09T00:00:00Z'), new Date('2026-01-05T00:00:00Z')),
    ).toThrow(RangeError);
  });
});
