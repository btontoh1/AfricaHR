import { computeQuickRatio } from './quick-ratio';

describe('computeQuickRatio', () => {
  it('divides gains by losses', () => {
    expect(computeQuickRatio(800, 200)).toBe(4);
  });

  it('reports below 1 when shrinking', () => {
    expect(computeQuickRatio(100, 400)).toBe(0.25);
  });

  it('returns null when there were no losses to divide by', () => {
    expect(computeQuickRatio(500, 0)).toBeNull();
  });
});
