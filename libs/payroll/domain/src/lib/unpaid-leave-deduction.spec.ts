import { computeUnpaidLeaveDeduction } from './unpaid-leave-deduction';

describe('computeUnpaidLeaveDeduction', () => {
  it('returns 0 when there are no unpaid days', () => {
    const result = computeUnpaidLeaveDeduction(3000, 0, new Date('2026-02-01'), new Date('2026-02-28'));

    expect(result).toBe(0);
  });

  it('pro-rates a daily rate against the number of working days in the period', () => {
    // Feb 2026: 1st is a Sunday, 28th is a Saturday - 20 weekdays in the period.
    const result = computeUnpaidLeaveDeduction(4000, 2, new Date('2026-02-01'), new Date('2026-02-28'));

    expect(result).toBe(400); // (4000 / 20) * 2
  });

  it('rounds to 2 decimal places', () => {
    const result = computeUnpaidLeaveDeduction(1000, 1, new Date('2026-02-01'), new Date('2026-02-28'));

    expect(result).toBe(50); // 1000 / 20 = 50 exactly
  });

  it('returns 0 when the pay period has no working days', () => {
    // A single Saturday.
    const result = computeUnpaidLeaveDeduction(4000, 1, new Date('2026-02-07'), new Date('2026-02-07'));

    expect(result).toBe(0);
  });
});
