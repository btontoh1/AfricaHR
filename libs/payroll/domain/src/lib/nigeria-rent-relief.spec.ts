import { calculateNigeriaRentRelief } from './nigeria-rent-relief';

describe('calculateNigeriaRentRelief', () => {
  it('returns 20% of annual rent, expressed as a monthly figure, when under the cap', () => {
    const result = calculateNigeriaRentRelief(1_200_000);

    // 20% of 1,200,000 = 240,000/yr -> 240,000/12 = 20,000/mo
    expect(result).toBe(20000);
  });

  it('caps relief at NGN 500,000/yr when 20% of rent exceeds it', () => {
    const result = calculateNigeriaRentRelief(3_000_000);

    // 20% of 3,000,000 = 600,000 > 500,000 cap -> 500,000/12 = 41,666.67/mo
    expect(result).toBe(41666.67);
  });

  it('returns zero when no rent is on file', () => {
    expect(calculateNigeriaRentRelief(0)).toBe(0);
  });
});
