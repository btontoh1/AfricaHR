import { enumerateMonths } from './month-sequence';

describe('enumerateMonths', () => {
  it('lists every month inclusive, within a year', () => {
    expect(enumerateMonths('2026-01', '2026-04')).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
  });

  it('crosses a year boundary', () => {
    expect(enumerateMonths('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('returns a single month when start equals end', () => {
    expect(enumerateMonths('2026-06', '2026-06')).toEqual(['2026-06']);
  });
});
