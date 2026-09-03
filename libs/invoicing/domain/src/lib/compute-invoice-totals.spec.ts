import { computeInvoiceTotals } from './compute-invoice-totals';

describe('computeInvoiceTotals', () => {
  it('sums quantity * unitPrice across line items for the subtotal', () => {
    const totals = computeInvoiceTotals(
      [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 250 },
      ],
      0,
    );

    expect(totals.subtotal).toBe(450);
  });

  it('applies the tax rate as a percentage of the subtotal', () => {
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 1000 }], 15);

    expect(totals.taxAmount).toBe(150);
    expect(totals.total).toBe(1150);
  });

  it('treats a 0% tax rate as no tax', () => {
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 1000 }], 0);

    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(1000);
  });

  it('returns all-zero totals for an empty line item list', () => {
    const totals = computeInvoiceTotals([], 15);

    expect(totals).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });

  it('rounds the subtotal to 2 decimal places', () => {
    // 3 * 0.1 in floating point is 0.30000000000000004 - the whole point of
    // rounding at each stage is that this never leaks into a stored total.
    const totals = computeInvoiceTotals([{ quantity: 3, unitPrice: 0.1 }], 0);

    expect(totals.subtotal).toBe(0.3);
  });

  it('rounds the tax amount to 2 decimal places independently of the subtotal', () => {
    // subtotal 10, 12.5% -> 1.25 exactly, but a rate that produces a
    // half-cent (e.g. 33.33%) must round rather than carry extra precision
    // into the stored total.
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 10 }], 33.33);

    expect(totals.taxAmount).toBe(3.33);
    expect(totals.total).toBe(13.33);
  });

  it('rounds the total independently, not just as subtotal + taxAmount added after rounding', () => {
    const totals = computeInvoiceTotals([{ quantity: 1, unitPrice: 19.99 }], 7.5);

    // subtotal 19.99, tax 19.99 * 0.075 = 1.49925 -> rounds to 1.50
    expect(totals.taxAmount).toBe(1.5);
    expect(totals.total).toBe(21.49);
  });

  it('sums multiple line items with different quantities and prices before applying tax once', () => {
    const totals = computeInvoiceTotals(
      [
        { quantity: 5, unitPrice: 19.99 },
        { quantity: 2, unitPrice: 49.5 },
        { quantity: 1, unitPrice: 3.33 },
      ],
      12.5,
    );

    // subtotal = 99.95 + 99.00 + 3.33 = 202.28
    expect(totals.subtotal).toBe(202.28);
    expect(totals.taxAmount).toBe(25.29);
    expect(totals.total).toBe(227.57);
  });
});
