import { computeOvertimePay } from './overtime-pay';

describe('computeOvertimePay', () => {
  it('returns 0 when there are no overtime hours', () => {
    const result = computeOvertimePay(3000, 0, new Date('2026-02-01'), new Date('2026-02-28'), 8, 1.5);

    expect(result).toBe(0);
  });

  it('pays the implied hourly rate times the multiplier times overtime hours', () => {
    // Feb 2026: 1st is a Sunday, 28th is a Saturday - 20 weekdays in the period.
    // Hourly rate: 4000 / (20 * 8) = 25. Overtime: 25 * 1.5 * 4 = 150.
    const result = computeOvertimePay(4000, 4, new Date('2026-02-01'), new Date('2026-02-28'), 8, 1.5);

    expect(result).toBe(150);
  });

  it('rounds to 2 decimal places', () => {
    const result = computeOvertimePay(1000, 1, new Date('2026-02-01'), new Date('2026-02-28'), 8, 1.5);

    expect(result).toBe(9.38); // (1000 / 160) * 1.5 = 9.375
  });

  it('returns 0 when the pay period has no working days', () => {
    // A single Saturday.
    const result = computeOvertimePay(4000, 4, new Date('2026-02-07'), new Date('2026-02-07'), 8, 1.5);

    expect(result).toBe(0);
  });

  it('returns 0 when standardDailyHours is not positive', () => {
    const result = computeOvertimePay(4000, 4, new Date('2026-02-01'), new Date('2026-02-28'), 0, 1.5);

    expect(result).toBe(0);
  });
});
