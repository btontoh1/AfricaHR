import { isExpiringSoon, nextBillingPeriod } from './billing-period';

describe('nextBillingPeriod', () => {
  it('advances the period by one calendar month', () => {
    const { start, end } = nextBillingPeriod(new Date('2026-08-01T00:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });
});

describe('isExpiringSoon', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');

  it('is true when the period ends within the window', () => {
    expect(isExpiringSoon(new Date('2026-08-05T00:00:00.000Z'), now, 7)).toBe(true);
  });

  it('is false when the period ends beyond the window', () => {
    expect(isExpiringSoon(new Date('2026-08-20T00:00:00.000Z'), now, 7)).toBe(false);
  });

  it('is false once the period has already lapsed', () => {
    expect(isExpiringSoon(new Date('2026-07-25T00:00:00.000Z'), now, 7)).toBe(false);
  });
});
