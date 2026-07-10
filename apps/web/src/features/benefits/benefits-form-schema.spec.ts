import {
  benefitPlanFormSchema,
  enrollEmployeeFormSchema,
  selfEnrollFormSchema,
} from './benefits-form-schema';

describe('benefitPlanFormSchema', () => {
  const validInput = {
    name: 'Private Health Insurance',
    code: 'HEALTH',
    description: '',
    contributionType: 'PERCENTAGE' as const,
    employeeContribution: '0.02',
    employerContribution: '0.03',
  };

  it('accepts a valid submission', () => {
    expect(benefitPlanFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a lowercase code', () => {
    expect(benefitPlanFormSchema.safeParse({ ...validInput, code: 'health' }).success).toBe(
      false,
    );
  });

  it('rejects a missing employee contribution', () => {
    expect(
      benefitPlanFormSchema.safeParse({ ...validInput, employeeContribution: '' }).success,
    ).toBe(false);
  });
});

describe('enrollEmployeeFormSchema', () => {
  it('accepts a valid submission', () => {
    const result = enrollEmployeeFormSchema.safeParse({
      employeeId: '123e4567-e89b-42d3-a456-426614174000',
      benefitPlanId: '123e4567-e89b-42d3-a456-426614174001',
      effectiveDate: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed employeeId', () => {
    const result = enrollEmployeeFormSchema.safeParse({
      employeeId: 'not-a-uuid',
      benefitPlanId: '123e4567-e89b-42d3-a456-426614174001',
    });
    expect(result.success).toBe(false);
  });
});

describe('selfEnrollFormSchema', () => {
  it('accepts a valid plan selection', () => {
    expect(
      selfEnrollFormSchema.safeParse({ benefitPlanId: '123e4567-e89b-42d3-a456-426614174000' })
        .success,
    ).toBe(true);
  });

  it('rejects a missing plan selection', () => {
    expect(selfEnrollFormSchema.safeParse({ benefitPlanId: '' }).success).toBe(false);
  });
});
