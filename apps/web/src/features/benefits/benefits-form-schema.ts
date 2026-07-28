import { z } from 'zod';

const CONTRIBUTION_TYPES = ['PERCENTAGE', 'FIXED'] as const;

// Mirrors CreateBenefitPlanDto (libs/benefits/feature/src/lib/dto/create-benefit-plan.dto.ts).
export const benefitPlanFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().regex(/^[A-Z0-9_]{1,30}$/, 'Uppercase letters, digits, or underscores'),
  description: z.string().max(500).optional().or(z.literal('')),
  contributionType: z.enum(CONTRIBUTION_TYPES),
  employeeContribution: z.string().min(1, 'Employee contribution is required'),
  employerContribution: z.string().min(1, 'Employer contribution is required'),
});

export type BenefitPlanFormValues = z.infer<typeof benefitPlanFormSchema>;

export const CONTRIBUTION_TYPE_OPTIONS = CONTRIBUTION_TYPES;

/**
 * The API stores PERCENTAGE contributions as a fraction of base salary
 * (e.g. 0.02 for 2%, see CreateBenefitPlanDto), but admins naturally think
 * in whole percentage points, so the form collects "2" and this converts
 * it before submission. FIXED contributions are already a flat currency
 * amount — no conversion.
 *
 * Regression coverage: a missing /100 here once shipped and silently
 * inflated every PERCENTAGE plan's contribution by 100x (e.g. a 2%/5%
 * plan on a 4,500 salary enrolled at 9,000/22,500 instead of 90/225).
 */
export function toContributionRate(
  value: string,
  contributionType: BenefitPlanFormValues['contributionType'],
): number {
  return contributionType === 'PERCENTAGE' ? Number(value) / 100 : Number(value);
}

// Mirrors EnrollEmployeeDto — HR enrolling an arbitrary employee.
export const enrollEmployeeFormSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  benefitPlanId: z.string().uuid('Select a benefit plan'),
  effectiveDate: z.string().optional().or(z.literal('')),
});

export type EnrollEmployeeFormValues = z.infer<typeof enrollEmployeeFormSchema>;

// Mirrors CreateBenefitEnrollmentDto — self-service enroll (no employeeId).
export const selfEnrollFormSchema = z.object({
  benefitPlanId: z.string().uuid('Select a benefit plan'),
});

export type SelfEnrollFormValues = z.infer<typeof selfEnrollFormSchema>;
