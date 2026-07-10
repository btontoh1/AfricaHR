import { payRunFormSchema, payslipLineItemFormSchema } from './payroll-form-schema';

describe('payRunFormSchema', () => {
  const validInput = {
    organizationId: '123e4567-e89b-42d3-a456-426614174000',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    payDate: '2026-07-01',
  };

  it('accepts a valid submission', () => {
    expect(payRunFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a malformed organizationId', () => {
    expect(
      payRunFormSchema.safeParse({ ...validInput, organizationId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('rejects a missing period start', () => {
    expect(payRunFormSchema.safeParse({ ...validInput, periodStart: '' }).success).toBe(false);
  });
});

describe('payslipLineItemFormSchema', () => {
  it('accepts a valid earning line item', () => {
    const result = payslipLineItemFormSchema.safeParse({
      type: 'EARNING',
      code: 'OVERTIME',
      description: '',
      amount: '150',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty code', () => {
    const result = payslipLineItemFormSchema.safeParse({
      type: 'EARNING',
      code: '',
      description: '',
      amount: '150',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty amount', () => {
    const result = payslipLineItemFormSchema.safeParse({
      type: 'DEDUCTION',
      code: 'LOAN',
      description: '',
      amount: '',
    });
    expect(result.success).toBe(false);
  });
});
