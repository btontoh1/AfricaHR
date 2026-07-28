import {
  benefitPlanFormSchema,
  enrollEmployeeFormSchema,
  selfEnrollFormSchema,
  toContributionRate,
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

describe('toContributionRate', () => {
  // Regression test: this conversion was once missing entirely, so a form
  // input of "2" (meant as 2%) was sent to the API as a raw 2 instead of
  // 0.02 — a 100x-too-high contribution on every PERCENTAGE plan.
  it('divides a PERCENTAGE input by 100', () => {
    expect(toContributionRate('2', 'PERCENTAGE')).toBe(0.02);
    expect(toContributionRate('5', 'PERCENTAGE')).toBe(0.05);
  });

  it('leaves a FIXED input unconverted', () => {
    expect(toContributionRate('50', 'FIXED')).toBe(50);
  });

  it('handles fractional percentage points', () => {
    expect(toContributionRate('2.5', 'PERCENTAGE')).toBeCloseTo(0.025);
  });

  it('handles zero', () => {
    expect(toContributionRate('0', 'PERCENTAGE')).toBe(0);
    expect(toContributionRate('0', 'FIXED')).toBe(0);
  });
});
