import { resolvePaystackBankListParams } from './paystack-bank-list-params';

describe('resolvePaystackBankListParams', () => {
  it('maps Ghana bank accounts to country=ghana, type=ghipss', () => {
    expect(resolvePaystackBankListParams('GH', 'BANK_ACCOUNT')).toEqual({
      country: 'ghana',
      type: 'ghipss',
    });
  });

  it('maps Ghana mobile money to country=ghana, type=mobile_money', () => {
    expect(resolvePaystackBankListParams('GH', 'MOBILE_MONEY')).toEqual({
      country: 'ghana',
      type: 'mobile_money',
    });
  });

  it('maps Nigeria bank accounts to country=nigeria with no type filter', () => {
    expect(resolvePaystackBankListParams('NG', 'BANK_ACCOUNT')).toEqual({ country: 'nigeria' });
  });

  it('returns null for Nigerian mobile money - unsupported, same as payroll disbursement', () => {
    expect(resolvePaystackBankListParams('NG', 'MOBILE_MONEY')).toBeNull();
  });

  it('returns null for an unmapped country', () => {
    expect(resolvePaystackBankListParams('KE', 'BANK_ACCOUNT')).toBeNull();
  });
});
