import { computeFirstRunDate, computeNextRunDate, isPastEndDate } from './recurring-journal-entry-schedule';

describe('computeFirstRunDate', () => {
  it('uses the same month when dayOfMonth has not passed yet', () => {
    expect(computeFirstRunDate(new Date('2026-03-01'), 15)).toEqual(new Date('2026-03-15'));
  });

  it('uses the same month when startDate lands exactly on dayOfMonth', () => {
    expect(computeFirstRunDate(new Date('2026-03-15'), 15)).toEqual(new Date('2026-03-15'));
  });

  it('rolls to the following month when dayOfMonth has already passed', () => {
    expect(computeFirstRunDate(new Date('2026-03-20'), 15)).toEqual(new Date('2026-04-15'));
  });

  it('rolls across a year boundary', () => {
    expect(computeFirstRunDate(new Date('2026-12-20'), 15)).toEqual(new Date('2027-01-15'));
  });
});

describe('computeNextRunDate', () => {
  it('advances exactly one month, same dayOfMonth', () => {
    expect(computeNextRunDate(new Date('2026-03-15'), 15)).toEqual(new Date('2026-04-15'));
  });

  it('advances across a year boundary', () => {
    expect(computeNextRunDate(new Date('2026-12-15'), 15)).toEqual(new Date('2027-01-15'));
  });

  it('only ever advances one period, even if the previous run date is already far in the past', () => {
    expect(computeNextRunDate(new Date('2026-01-15'), 15)).toEqual(new Date('2026-02-15'));
  });
});

describe('isPastEndDate', () => {
  it('is false when there is no end date', () => {
    expect(isPastEndDate(new Date('2026-05-15'), null)).toBe(false);
  });

  it('is false when the run date is on or before the end date', () => {
    expect(isPastEndDate(new Date('2026-05-15'), new Date('2026-05-15'))).toBe(false);
    expect(isPastEndDate(new Date('2026-04-15'), new Date('2026-05-15'))).toBe(false);
  });

  it('is true once the run date is after the end date', () => {
    expect(isPastEndDate(new Date('2026-06-15'), new Date('2026-05-15'))).toBe(true);
  });
});
