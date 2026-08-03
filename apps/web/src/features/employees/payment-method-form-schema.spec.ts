import { paymentMethodFormSchema } from './payment-method-form-schema';

describe('paymentMethodFormSchema', () => {
  it('accepts a valid bank account submission', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'BANK_ACCOUNT',
      bankName: 'GCB Bank',
      bankCode: '040',
      accountNumber: '1234567890',
      accountName: 'Frimpong Tontoh',
      mobileMoneyProvider: '',
      mobileMoneyNumber: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a bank account submission missing the account number', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'BANK_ACCOUNT',
      bankName: 'GCB Bank',
      bankCode: '040',
      accountNumber: '',
      accountName: 'Frimpong Tontoh',
      mobileMoneyProvider: '',
      mobileMoneyNumber: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a bank account submission missing the bank code', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'BANK_ACCOUNT',
      bankName: 'GCB Bank',
      bankCode: '',
      accountNumber: '1234567890',
      accountName: 'Frimpong Tontoh',
      mobileMoneyProvider: '',
      mobileMoneyNumber: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid mobile money submission', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'MOBILE_MONEY',
      bankName: '',
      bankCode: 'MTN',
      accountNumber: '',
      accountName: '',
      mobileMoneyProvider: 'MTN Mobile Money',
      mobileMoneyNumber: '0244000000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a mobile money submission missing the provider', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'MOBILE_MONEY',
      bankName: '',
      bankCode: 'MTN',
      accountNumber: '',
      accountName: '',
      mobileMoneyProvider: '',
      mobileMoneyNumber: '0244000000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a mobile money submission missing the provider code', () => {
    const result = paymentMethodFormSchema.safeParse({
      type: 'MOBILE_MONEY',
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
      mobileMoneyProvider: 'MTN Mobile Money',
      mobileMoneyNumber: '0244000000',
    });
    expect(result.success).toBe(false);
  });
});
