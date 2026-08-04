import { roundCurrency } from './money';

// Mirrors benefits-domain's BenefitContributionType exactly. Duplicated,
// not imported - scope:payroll cannot depend on scope:benefits (Nx module
// boundary, see eslint.config.mjs), same reasoning PayrollEmployeeRepository
// gives for deriving its own copy of PAYMENT_METHOD_ENCRYPTION_KEY instead
// of reusing employee-feature's PaymentMethodService.
export const BenefitContributionType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

export type BenefitContributionType = (typeof BenefitContributionType)[keyof typeof BenefitContributionType];

export interface BenefitEnrollmentContribution {
  contributionType: BenefitContributionType;
  employeeContribution: number;
  employerContribution: number;
}

export interface BenefitContributionTotals {
  employeeTotal: number;
  employerTotal: number;
}

/**
 * Sums every active benefit enrollment's employee/employer contribution
 * for a payslip. PERCENTAGE rates are a fraction of basic salary (same
 * shape as SSNIT); FIXED rates are a flat amount regardless of salary -
 * mirrors benefits-domain's computeBenefitContribution exactly (see this
 * file's module-boundary note for why it's duplicated rather than
 * imported). Each enrollment's contribution is rounded individually before
 * summing, so the aggregate matches the sum of what's shown per-plan
 * elsewhere (e.g. the employee's own benefits page) rather than drifting
 * from rounding the total once.
 */
export function sumBenefitContributions(
  enrollments: readonly BenefitEnrollmentContribution[],
  basicSalary: number,
): BenefitContributionTotals {
  let employeeTotal = 0;
  let employerTotal = 0;

  for (const enrollment of enrollments) {
    const isFixed = enrollment.contributionType === BenefitContributionType.FIXED;
    employeeTotal += roundCurrency(
      isFixed ? enrollment.employeeContribution : basicSalary * enrollment.employeeContribution,
    );
    employerTotal += roundCurrency(
      isFixed ? enrollment.employerContribution : basicSalary * enrollment.employerContribution,
    );
  }

  return { employeeTotal: roundCurrency(employeeTotal), employerTotal: roundCurrency(employerTotal) };
}
