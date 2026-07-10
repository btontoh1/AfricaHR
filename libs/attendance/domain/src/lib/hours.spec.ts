import { computeHoursWorked, roundHours } from './hours';

describe('roundHours', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundHours(8.3333333)).toBe(8.33);
  });
});

describe('computeHoursWorked', () => {
  it('computes elapsed hours between clockIn and clockOut', () => {
    const clockIn = new Date('2026-02-02T08:00:00Z');
    const clockOut = new Date('2026-02-02T17:00:00Z');

    expect(computeHoursWorked(clockIn, clockOut)).toBe(9);
  });

  it('rounds partial hours to 2 decimal places', () => {
    const clockIn = new Date('2026-02-02T08:00:00Z');
    const clockOut = new Date('2026-02-02T16:50:00Z');

    expect(computeHoursWorked(clockIn, clockOut)).toBe(8.83);
  });

  it('throws when clockOut is not after clockIn', () => {
    const clockIn = new Date('2026-02-02T08:00:00Z');

    expect(() => computeHoursWorked(clockIn, clockIn)).toThrow(RangeError);
    expect(() => computeHoursWorked(clockIn, new Date('2026-02-02T07:00:00Z'))).toThrow(RangeError);
  });
});
