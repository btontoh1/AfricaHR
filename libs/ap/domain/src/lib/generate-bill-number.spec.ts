import { generateBillNumber } from './generate-bill-number';

describe('generateBillNumber', () => {
  it('formats a single-digit sequence zero-padded to 4 digits', () => {
    expect(generateBillNumber(1)).toBe('BILL-0001');
  });

  it('formats a multi-digit sequence zero-padded to 4 digits', () => {
    expect(generateBillNumber(42)).toBe('BILL-0042');
  });

  it('does not truncate a sequence longer than 4 digits', () => {
    expect(generateBillNumber(12345)).toBe('BILL-12345');
  });

  it('formats the boundary case of exactly 4 digits without extra padding', () => {
    expect(generateBillNumber(9999)).toBe('BILL-9999');
  });
});
