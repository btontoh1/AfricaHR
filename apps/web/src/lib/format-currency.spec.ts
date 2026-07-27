import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats a numeric amount with its currency code', () => {
    expect(formatCurrency(91200, 'NGN')).toBe('NGN 91,200.00');
  });

  it('formats a string amount (as returned by the API) the same way', () => {
    expect(formatCurrency('40772.17', 'GHS')).toBe('GHS 40,772.17');
  });

  it('falls back to a plain number when no currency code is available', () => {
    expect(formatCurrency(1200, null)).toBe('1,200.00');
  });

  it('returns an em dash for null, undefined, or empty amounts', () => {
    expect(formatCurrency(null, 'GHS')).toBe('—');
    expect(formatCurrency(undefined, 'GHS')).toBe('—');
    expect(formatCurrency('', 'GHS')).toBe('—');
  });
});
