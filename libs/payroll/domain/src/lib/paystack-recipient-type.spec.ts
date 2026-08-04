import { resolvePaystackRecipientType } from './paystack-recipient-type';

describe('resolvePaystackRecipientType', () => {
  it('maps a Ghanaian bank account to ghipss', () => {
    expect(resolvePaystackRecipientType('GH', 'BANK_ACCOUNT')).toBe('ghipss');
  });

  it('maps Ghanaian mobile money to mobile_money', () => {
    expect(resolvePaystackRecipientType('GH', 'MOBILE_MONEY')).toBe('mobile_money');
  });

  it('maps a Nigerian bank account to nuban', () => {
    expect(resolvePaystackRecipientType('NG', 'BANK_ACCOUNT')).toBe('nuban');
  });

  it('returns null for Nigerian mobile money - Paystack NG has no transfer recipient type for it', () => {
    expect(resolvePaystackRecipientType('NG', 'MOBILE_MONEY')).toBeNull();
  });

  it('maps Kenyan mobile money to mobile_money', () => {
    expect(resolvePaystackRecipientType('KE', 'MOBILE_MONEY')).toBe('mobile_money');
  });

  it('returns null for a Kenyan bank account - Paystack Transfers in Kenya is mobile money only', () => {
    expect(resolvePaystackRecipientType('KE', 'BANK_ACCOUNT')).toBeNull();
  });

  it('returns null for an unmapped country', () => {
    expect(resolvePaystackRecipientType('ZA', 'BANK_ACCOUNT')).toBeNull();
  });
});
