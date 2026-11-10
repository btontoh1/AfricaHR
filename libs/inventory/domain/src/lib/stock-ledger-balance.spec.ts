import { buildReversalEntry, netQuantity, wouldGoNegative } from './stock-ledger-balance';

describe('netQuantity', () => {
  it('is positive when quantityIn exceeds quantityOut', () => {
    expect(netQuantity({ quantityIn: 10, quantityOut: 3 })).toBe(7);
  });

  it('is negative when quantityOut exceeds quantityIn', () => {
    expect(netQuantity({ quantityIn: 0, quantityOut: 5 })).toBe(-5);
  });
});

describe('wouldGoNegative', () => {
  it('is false when enough stock is on hand', () => {
    expect(wouldGoNegative(10, 10)).toBe(false);
  });

  it('is true when issuing more than is on hand', () => {
    expect(wouldGoNegative(10, 11)).toBe(true);
  });

  it('is false for a zero-quantity issue against zero balance', () => {
    expect(wouldGoNegative(0, 0)).toBe(false);
  });
});

describe('buildReversalEntry', () => {
  it('swaps quantityIn and quantityOut, keeping warehouse/product/cost', () => {
    const original = { warehouseId: 'wh-1', productId: 'prod-1', quantityIn: 50, quantityOut: 0, unitCost: 12.5 };

    expect(buildReversalEntry(original)).toEqual({
      warehouseId: 'wh-1',
      productId: 'prod-1',
      quantityIn: 0,
      quantityOut: 50,
      unitCost: 12.5,
    });
  });
});
