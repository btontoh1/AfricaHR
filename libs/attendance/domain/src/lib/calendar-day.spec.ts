import { toCalendarDay } from './calendar-day';

describe('toCalendarDay', () => {
  it('truncates a timestamp to UTC midnight of its calendar day', () => {
    const result = toCalendarDay(new Date('2026-02-02T17:45:33.123Z'));

    expect(result.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });

  it('is idempotent on an already-truncated date', () => {
    const alreadyMidnight = new Date('2026-02-02T00:00:00.000Z');

    expect(toCalendarDay(alreadyMidnight).toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });
});
