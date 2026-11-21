import { calculateInvoiceAmount } from './invoice-amount';

describe('calculateInvoiceAmount', () => {
  it('multiplies price per employee by headcount', () => {
    expect(calculateInvoiceAmount(50, 20)).toBe(1000);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateInvoiceAmount(10.005, 3)).toBe(30.02);
  });

  it('returns 0 for a tenant with no active employees', () => {
    expect(calculateInvoiceAmount(50, 0)).toBe(0);
  });

  it('adds a flat fee on top of the per-employee amount', () => {
    expect(calculateInvoiceAmount(50, 20, 499)).toBe(1499);
  });

  it('only charges per-employee for the remainder beyond the included count', () => {
    expect(calculateInvoiceAmount(50, 12, 499, 10)).toBe(499 + 50 * 2);
  });

  it('charges just the flat fee when headcount is within the included count', () => {
    expect(calculateInvoiceAmount(50, 8, 499, 10)).toBe(499);
  });

  it('never goes negative when headcount is 0 but employees are included', () => {
    expect(calculateInvoiceAmount(50, 0, 499, 10)).toBe(499);
  });
});
