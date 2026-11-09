import { convertQuantity, wouldCreateCycle } from './unit-conversion';

describe('wouldCreateCycle', () => {
  it('rejects a self-referencing edge', () => {
    expect(wouldCreateCycle([], { fromUnitId: 'box', toUnitId: 'box' })).toBe(true);
  });

  it('rejects an edge that would close a loop', () => {
    const existing = [
      { fromUnitId: 'carton', toUnitId: 'box', factor: 20 },
      { fromUnitId: 'box', toUnitId: 'strip', factor: 10 },
    ];
    expect(wouldCreateCycle(existing, { fromUnitId: 'strip', toUnitId: 'carton' })).toBe(true);
  });

  it('allows a new edge that extends the graph without looping', () => {
    const existing = [{ fromUnitId: 'carton', toUnitId: 'box', factor: 20 }];
    expect(wouldCreateCycle(existing, { fromUnitId: 'box', toUnitId: 'strip' })).toBe(false);
  });

  it('allows a completely disconnected edge', () => {
    const existing = [{ fromUnitId: 'carton', toUnitId: 'box', factor: 20 }];
    expect(wouldCreateCycle(existing, { fromUnitId: 'litre', toUnitId: 'millilitre' })).toBe(false);
  });
});

describe('convertQuantity', () => {
  const edges = [
    { fromUnitId: 'carton', toUnitId: 'box', factor: 20 },
    { fromUnitId: 'box', toUnitId: 'strip', factor: 10 },
    { fromUnitId: 'strip', toUnitId: 'tablet', factor: 10 },
  ];

  it('returns the quantity unchanged when converting a unit to itself', () => {
    expect(convertQuantity(edges, 'box', 'box', 5)).toBe(5);
  });

  it('converts directly along a single edge', () => {
    expect(convertQuantity(edges, 'carton', 'box', 2)).toBe(40);
  });

  it('converts along a multi-hop chain', () => {
    expect(convertQuantity(edges, 'carton', 'tablet', 1)).toBe(2000);
  });

  it('converts in reverse along a stored edge', () => {
    expect(convertQuantity(edges, 'box', 'carton', 20)).toBe(1);
  });

  it('returns null when no path connects the two units', () => {
    expect(convertQuantity(edges, 'carton', 'litre', 1)).toBeNull();
  });
});
