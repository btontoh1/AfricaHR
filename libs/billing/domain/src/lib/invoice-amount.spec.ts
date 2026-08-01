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
});
