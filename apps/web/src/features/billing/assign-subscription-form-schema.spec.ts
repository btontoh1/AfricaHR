import { assignSubscriptionFormSchema } from './assign-subscription-form-schema';

describe('assignSubscriptionFormSchema', () => {
  const validInput = { pricePerEmployee: '10', currency: 'GHS' };

  it('accepts a valid submission', () => {
    expect(assignSubscriptionFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('lowercases the currency to the required 3-letter code', () => {
    const result = assignSubscriptionFormSchema.safeParse({ ...validInput, currency: 'ghs' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.currency).toBe('GHS');
  });

  it('rejects a zero or negative price', () => {
    expect(assignSubscriptionFormSchema.safeParse({ ...validInput, pricePerEmployee: '0' }).success).toBe(
      false,
    );
    expect(
      assignSubscriptionFormSchema.safeParse({ ...validInput, pricePerEmployee: '-5' }).success,
    ).toBe(false);
  });

  it('rejects a non-3-letter currency code', () => {
    expect(assignSubscriptionFormSchema.safeParse({ ...validInput, currency: 'GH' }).success).toBe(
      false,
    );
  });

  it('rejects an empty price', () => {
    expect(assignSubscriptionFormSchema.safeParse({ ...validInput, pricePerEmployee: '' }).success).toBe(
      false,
    );
  });
});
