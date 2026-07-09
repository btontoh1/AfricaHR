import { hasSufficientBalance, remainingDays } from './leave-balance';

describe('remainingDays', () => {
  it('subtracts used from entitled', () => {
    expect(remainingDays(15, 5)).toBe(10);
  });
});

describe('hasSufficientBalance', () => {
  it('allows a request that exactly exhausts the remaining balance', () => {
    expect(hasSufficientBalance(15, 5, 10)).toBe(true);
  });

  it('rejects a request that exceeds the remaining balance', () => {
    expect(hasSufficientBalance(15, 5, 11)).toBe(false);
  });

  it('rejects any request when the balance is already exhausted', () => {
    expect(hasSufficientBalance(15, 15, 1)).toBe(false);
  });
});
