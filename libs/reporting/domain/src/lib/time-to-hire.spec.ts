import { calculateAverageTimeToHireDays, calculateTimeToHireDays } from './time-to-hire';

describe('calculateTimeToHireDays', () => {
  it('computes whole calendar days between application and hire', () => {
    expect(
      calculateTimeToHireDays(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-15T00:00:00Z')),
    ).toBe(14);
  });

  it('clamps a negative span to 0', () => {
    expect(
      calculateTimeToHireDays(new Date('2026-01-15T00:00:00Z'), new Date('2026-01-01T00:00:00Z')),
    ).toBe(0);
  });
});

describe('calculateAverageTimeToHireDays', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateAverageTimeToHireDays([])).toBe(0);
  });

  it('averages time-to-hire across multiple hires', () => {
    const result = calculateAverageTimeToHireDays([
      { appliedAt: new Date('2026-01-01T00:00:00Z'), hiredAt: new Date('2026-01-11T00:00:00Z') },
      { appliedAt: new Date('2026-01-01T00:00:00Z'), hiredAt: new Date('2026-01-21T00:00:00Z') },
    ]);

    expect(result).toBe(15);
  });
});
