import { generateInvoiceNumber } from './generate-invoice-number';

describe('generateInvoiceNumber', () => {
  it('formats a single-digit sequence zero-padded to 4 digits', () => {
    expect(generateInvoiceNumber(1)).toBe('INV-0001');
  });

  it('formats a multi-digit sequence zero-padded to 4 digits', () => {
    expect(generateInvoiceNumber(42)).toBe('INV-0042');
  });

  it('does not truncate a sequence longer than 4 digits', () => {
    expect(generateInvoiceNumber(12345)).toBe('INV-12345');
  });

  it('formats the boundary case of exactly 4 digits without extra padding', () => {
    expect(generateInvoiceNumber(9999)).toBe('INV-9999');
  });
});
