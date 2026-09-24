import { computeBillTotals } from './compute-bill-totals';

describe('computeBillTotals', () => {
  it('sums quantity * unitPrice across line items for the subtotal', () => {
    const totals = computeBillTotals(
      [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 250 },
      ],
      0,
    );

    expect(totals.subtotal).toBe(450);
  });

  it('applies the tax rate as a percentage of the subtotal', () => {
    const totals = computeBillTotals([{ quantity: 1, unitPrice: 1000 }], 15);

    expect(totals.taxAmount).toBe(150);
    expect(totals.total).toBe(1150);
  });

  it('treats a 0% tax rate as no tax', () => {
    const totals = computeBillTotals([{ quantity: 1, unitPrice: 1000 }], 0);

    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(1000);
  });

  it('returns all-zero totals for an empty line item list', () => {
    const totals = computeBillTotals([], 15);

    expect(totals).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });

  it('rounds the subtotal to 2 decimal places', () => {
    const totals = computeBillTotals([{ quantity: 3, unitPrice: 0.1 }], 0);

    expect(totals.subtotal).toBe(0.3);
  });

  it('rounds the tax amount and total to 2 decimal places independently', () => {
    const totals = computeBillTotals([{ quantity: 1, unitPrice: 10 }], 33.33);

    expect(totals.taxAmount).toBe(3.33);
    expect(totals.total).toBe(13.33);
  });
});
