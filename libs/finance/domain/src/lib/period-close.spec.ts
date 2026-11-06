import { canExtendPeriodClose, isDateWithinClosedPeriod } from './period-close';

describe('isDateWithinClosedPeriod', () => {
  it('returns false when nothing has ever been closed', () => {
    expect(isDateWithinClosedPeriod(new Date('2026-01-01'), null)).toBe(false);
  });

  it('returns true for a date on or before the closed-through date', () => {
    const closedThrough = new Date('2026-01-31');
    expect(isDateWithinClosedPeriod(new Date('2026-01-15'), closedThrough)).toBe(true);
    expect(isDateWithinClosedPeriod(new Date('2026-01-31'), closedThrough)).toBe(true);
  });

  it('returns false for a date after the closed-through date', () => {
    const closedThrough = new Date('2026-01-31');
    expect(isDateWithinClosedPeriod(new Date('2026-02-01'), closedThrough)).toBe(false);
  });
});

describe('canExtendPeriodClose', () => {
  it('allows any date when nothing has ever been closed', () => {
    expect(canExtendPeriodClose(null, new Date('2026-01-31'))).toBe(true);
  });

  it('allows extending forward to a later date', () => {
    expect(canExtendPeriodClose(new Date('2026-01-31'), new Date('2026-02-28'))).toBe(true);
  });

  it('allows re-closing through the same date', () => {
    expect(canExtendPeriodClose(new Date('2026-01-31'), new Date('2026-01-31'))).toBe(true);
  });

  it('rejects moving the close date earlier', () => {
    expect(canExtendPeriodClose(new Date('2026-02-28'), new Date('2026-01-31'))).toBe(false);
  });
});
