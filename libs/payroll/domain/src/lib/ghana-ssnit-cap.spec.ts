import { applyGhanaInsurableEarningsCap } from './ghana-ssnit-cap';

describe('applyGhanaInsurableEarningsCap', () => {
  it('leaves salary below the ceiling unchanged', () => {
    expect(applyGhanaInsurableEarningsCap(50_000)).toBe(50_000);
  });

  it('leaves salary exactly at the ceiling unchanged', () => {
    expect(applyGhanaInsurableEarningsCap(69_000)).toBe(69_000);
  });

  it('caps salary above the ceiling at GHS 69,000', () => {
    expect(applyGhanaInsurableEarningsCap(80_000)).toBe(69_000);
  });
});
