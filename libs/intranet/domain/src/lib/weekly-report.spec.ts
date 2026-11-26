import { DEFAULT_WEEKLY_REPORT_QUESTIONS, getWeekEnd, getWeekStart, isReportLate } from './weekly-report';

describe('getWeekStart', () => {
  it('returns the same Monday for a Monday input', () => {
    const monday = new Date('2026-11-23T10:00:00Z'); // a Monday
    expect(getWeekStart(monday).toISOString()).toBe('2026-11-23T00:00:00.000Z');
  });

  it('returns the preceding Monday for a mid-week input', () => {
    const wednesday = new Date('2026-11-25T23:59:00Z');
    expect(getWeekStart(wednesday).toISOString()).toBe('2026-11-23T00:00:00.000Z');
  });

  it('returns the preceding Monday for a Sunday input', () => {
    const sunday = new Date('2026-11-29T00:00:00Z');
    expect(getWeekStart(sunday).toISOString()).toBe('2026-11-23T00:00:00.000Z');
  });
});

describe('getWeekEnd', () => {
  it('is exactly 7 days after weekStart', () => {
    const weekStart = new Date('2026-11-23T00:00:00Z');
    expect(getWeekEnd(weekStart).toISOString()).toBe('2026-11-30T00:00:00.000Z');
  });
});

describe('isReportLate', () => {
  const weekStart = new Date('2026-11-23T00:00:00Z');

  it('is not late when submitted within the week', () => {
    const submittedAt = new Date('2026-11-27T12:00:00Z');
    expect(isReportLate(weekStart, submittedAt, new Date('2026-12-01T00:00:00Z'))).toBe(false);
  });

  it('is late when submitted after the week ended', () => {
    const submittedAt = new Date('2026-12-01T00:00:01Z');
    expect(isReportLate(weekStart, submittedAt, new Date('2026-12-02T00:00:00Z'))).toBe(true);
  });

  it('is not late when unsubmitted but the week has not ended yet', () => {
    expect(isReportLate(weekStart, null, new Date('2026-11-26T00:00:00Z'))).toBe(false);
  });

  it('is late when unsubmitted and the week has ended', () => {
    expect(isReportLate(weekStart, null, new Date('2026-12-01T00:00:01Z'))).toBe(true);
  });
});

describe('DEFAULT_WEEKLY_REPORT_QUESTIONS', () => {
  it('has three questions', () => {
    expect(DEFAULT_WEEKLY_REPORT_QUESTIONS).toHaveLength(3);
  });
});
