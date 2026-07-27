import { calculateNigeriaConsolidatedReliefAllowance } from './nigeria-relief';

describe('calculateNigeriaConsolidatedReliefAllowance', () => {
  it('uses the ₦200k/yr floor (÷12 monthly) when 1% of gross is smaller', () => {
    // 1% of 100,000 = 1,000, well under the 16,666.67 monthly floor
    const result = calculateNigeriaConsolidatedReliefAllowance(100_000);

    // 16,666.67 (floor) + 20,000 (20% of gross) = 36,666.67
    expect(result).toBe(36666.67);
  });

  it('uses 1% of gross when it exceeds the monthly floor', () => {
    // 1% of 2,000,000 = 20,000, above the 16,666.67 monthly floor
    const result = calculateNigeriaConsolidatedReliefAllowance(2_000_000);

    // 20,000 (1% of gross) + 400,000 (20% of gross) = 420,000
    expect(result).toBe(420000);
  });

  it('still applies the floor at zero gross pay, matching the statutory formula', () => {
    const result = calculateNigeriaConsolidatedReliefAllowance(0);

    expect(result).toBe(16666.67);
  });
});
