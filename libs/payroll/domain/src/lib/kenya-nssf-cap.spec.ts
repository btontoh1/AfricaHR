import { applyKenyaPensionableEarningsCap } from './kenya-nssf-cap';

describe('applyKenyaPensionableEarningsCap', () => {
  it('leaves salary below the ceiling unchanged', () => {
    expect(applyKenyaPensionableEarningsCap(50_000)).toBe(50_000);
  });

  it('leaves salary exactly at the ceiling unchanged', () => {
    expect(applyKenyaPensionableEarningsCap(108_000)).toBe(108_000);
  });

  it('caps salary above the ceiling at KES 108,000', () => {
    expect(applyKenyaPensionableEarningsCap(150_000)).toBe(108_000);
  });
});
