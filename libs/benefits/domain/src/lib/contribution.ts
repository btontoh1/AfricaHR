import { roundCurrency } from './money';

// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated BenefitContributionType without casts at the boundary.
export const BenefitContributionType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

export type BenefitContributionType =
  (typeof BenefitContributionType)[keyof typeof BenefitContributionType];

export interface BenefitContributionRates {
  employeeContribution: number;
  employerContribution: number;
}

export interface BenefitContribution {
  employee: number;
  employer: number;
}

/**
 * PERCENTAGE rates are a fraction of baseSalary (same shape as Payroll's
 * SSNIT calculator); FIXED rates are a flat amount regardless of salary.
 * Always computed live from the plan's current rates and the employee's
 * current baseSalary — never denormalized onto BenefitEnrollment (see
 * project memory for why: an enrollment has no point-in-time event to
 * snapshot at, unlike a payslip or a day's attendance).
 */
export function computeBenefitContribution(
  contributionType: BenefitContributionType,
  rates: BenefitContributionRates,
  baseSalary: number,
): BenefitContribution {
  if (contributionType === BenefitContributionType.FIXED) {
    return {
      employee: roundCurrency(rates.employeeContribution),
      employer: roundCurrency(rates.employerContribution),
    };
  }

  return {
    employee: roundCurrency(baseSalary * rates.employeeContribution),
    employer: roundCurrency(baseSalary * rates.employerContribution),
  };
}
