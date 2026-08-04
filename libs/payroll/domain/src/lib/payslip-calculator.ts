import { roundCurrency } from './money';
import { calculatePayeTax, TaxBand } from './tax-band';
import { calculateSsnit, SsnitRates } from './ssnit';
import { calculateNigeriaRentRelief } from './nigeria-rent-relief';
import { applyGhanaInsurableEarningsCap } from './ghana-ssnit-cap';
import { applyKenyaPensionableEarningsCap } from './kenya-nssf-cap';
import { applyKenyaPersonalRelief } from './kenya-personal-relief';
import { calculateKenyaShif } from './kenya-shif';
import { isEligibleForNigeriaNhis } from './nigeria-nhis-eligibility';
import { BenefitEnrollmentContribution, sumBenefitContributions } from './benefit-contribution';
import { PayslipLineItemType } from './payslip-line-item-type';

/** NSITF and NHIA's OPSSHIP both apply only once the employing organization has this many active employees - per public payroll-compliance summaries, not otherwise confirmed against nsitf.gov.ng/nhia.gov.ng directly (blocked by this environment's egress policy). */
const NIGERIA_EMPLOYER_LEVY_THRESHOLD = 5;

export interface PayslipLineItemInput {
  type: PayslipLineItemType;
  amount: number;
}

export interface ComputePayslipInput {
  countryCode: string;
  basicSalary: number;
  /** Nigeria only - annual rent paid, for Rent Relief Allowance eligibility. */
  annualRentPaid?: number;
  /** Ghana only - Tier 2 mandatory occupational pension employer contribution rate (e.g. 0.05). Employer-only; never deducted from the employee's pay. */
  ghanaTier2Rate?: number;
  /** Kenya only - SHIF employee contribution rate (e.g. 0.0275), subject to a KES 300 floor - see kenya-shif.ts. */
  kenyaShifRate?: number;
  /** Kenya only - Affordable Housing Levy employee contribution rate (e.g. 0.015). */
  kenyaHousingLevyEmployeeRate?: number;
  /** Kenya only - Affordable Housing Levy employer contribution rate (e.g. 0.015). Employer-only; never deducted from the employee's pay. */
  kenyaHousingLevyEmployerRate?: number;
  /** Nigeria only - the employing organization's active employee count, for NSITF/NHIS's 5+ employee threshold. */
  organizationEmployeeCount?: number;
  /** Nigeria only - NSITF contribution rate (e.g. 0.01). Employer-only; never deducted from the employee's pay. Only applies once organizationEmployeeCount meets the threshold. */
  nigeriaNsitfRate?: number;
  /** Nigeria only - NHIS (NHIA OPSSHIP) employee contribution rate (e.g. 0.05). Only applies once organizationEmployeeCount meets the threshold AND the employee's own basic salary meets NHIS's eligibility floor - see nigeria-nhis-eligibility.ts. */
  nigeriaNhisEmployeeRate?: number;
  /** Nigeria only - NHIS employer contribution rate (e.g. 0.1). Employer-only; same gating as nigeriaNhisEmployeeRate. */
  nigeriaNhisEmployerRate?: number;
  /** Every active BenefitEnrollment for this employee as of the pay date - each plan's premium is summed into benefitsEmployeeDeduction/benefitsEmployerCost. Defaults to no enrollments when omitted. */
  benefitEnrollments?: readonly BenefitEnrollmentContribution[];
  lineItems: readonly PayslipLineItemInput[];
  taxBands: readonly TaxBand[];
  ssnitRates: SsnitRates;
}

export interface ComputedPayslip {
  basicSalary: number;
  grossPay: number;
  taxableIncome: number;
  payeTax: number;
  ssnitEmployee: number;
  ssnitEmployer: number;
  /** Ghana only, else 0 - Tier 2's employer-only contribution. Not part of totalDeductions/netPay, same as ssnitEmployer. */
  ghanaTier2PensionEmployer: number;
  /** Kenya only, else 0 - reduces taxable income (pre-tax, like NSSF) and is part of totalDeductions/netPay. */
  kenyaShifEmployee: number;
  /** Kenya only, else 0 - part of totalDeductions/netPay, but does NOT reduce taxable income (its tax relief was repealed December 2024). */
  kenyaHousingLevyEmployee: number;
  /** Kenya only, else 0 - employer-only. Not part of totalDeductions/netPay, same as ssnitEmployer. */
  kenyaHousingLevyEmployer: number;
  /** Nigeria only, org threshold met, else 0 - employer-only NSITF contribution. Not part of totalDeductions/netPay, same as ssnitEmployer. */
  nigeriaNsitfEmployer: number;
  /** Nigeria only, org threshold + employee eligibility met, else 0 - part of totalDeductions/netPay, but does NOT reduce taxable income (see this function's doc comment on the unresolved NHIS tax-treatment conflict). */
  nigeriaNhisEmployee: number;
  /** Nigeria only, same gating as nigeriaNhisEmployee, else 0 - employer-only. Not part of totalDeductions/netPay. */
  nigeriaNhisEmployer: number;
  /** Sum of every active benefit-plan employee premium as of the pay date. Post-tax, like an ad-hoc deduction - does not reduce taxableIncome. Part of totalDeductions/netPay. */
  benefitsEmployeeDeduction: number;
  /** Sum of every active benefit-plan employer premium as of the pay date - cost-reporting only, not part of totalDeductions/netPay, same as ssnitEmployer. */
  benefitsEmployerCost: number;
  totalDeductions: number;
  netPay: number;
}

export function sumLineItems(
  lineItems: readonly PayslipLineItemInput[],
  type: PayslipLineItemType,
): number {
  const total = lineItems
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0);
  return roundCurrency(total);
}

/**
 * Computes one employee's payslip for a pay run. The employee's pension/
 * SSNIT-equivalent contribution is always deducted from gross pay before
 * PAYE is calculated — that ordering is standard mechanics, not a rate
 * that changes with policy, so it's encoded here rather than left as data.
 * Nigeria additionally deducts a Rent Relief Allowance before the PAYE
 * bands apply (see nigeria-rent-relief.ts) — every other country's taxable
 * income is just gross pay less the pension deduction. Ghana additionally
 * caps the salary SSNIT is computed on at the maximum insurable earnings
 * ceiling (see ghana-ssnit-cap.ts) — earnings above it are still fully
 * taxable, just no longer accrue SSNIT. Kenya caps pensionable pay the same
 * way (see kenya-nssf-cap.ts) and, unlike Nigeria's pre-tax relief, then
 * subtracts a flat personal relief from the PAYE bands' output itself (see
 * kenya-personal-relief.ts) rather than from taxable income.
 *
 * Ghana Tier 2 and Kenya's SHIF/Housing Levy are additional mandatory
 * statutory contributions on top of the core pension/PAYE above. Ghana
 * Tier 2 is entirely employer-paid, so it never touches taxable income,
 * totalDeductions, or netPay - it's computed and returned purely for
 * payroll-cost reporting, same as ssnitEmployer. Kenya's SHIF is an
 * allowable pre-tax deduction like NSSF (reduces taxable income) and an
 * employee deduction (reduces netPay); its Housing Levy is an employee
 * deduction too but does NOT reduce taxable income (that relief was
 * repealed in December 2024) - and its employer share, like Ghana Tier 2,
 * is cost-only.
 *
 * Nigeria's NSITF and NHIS only apply once the employing organization
 * clears a 5-employee threshold (see NIGERIA_EMPLOYER_LEVY_THRESHOLD) -
 * unlike every other country mechanic above, which applies to every
 * payslip of that country unconditionally. NHIS additionally requires
 * the individual employee's own basic salary to clear NHIS's own
 * eligibility floor (see nigeria-nhis-eligibility.ts) - an employee-level
 * gate this engine has never needed before. NSITF is employer-only, same
 * shape as Ghana Tier 2. NHIS's employee share reduces netPay but - given
 * directly conflicting public guidance on whether the 2025 Nigeria Tax
 * Act made it tax-deductible - is deliberately treated as NOT reducing
 * taxable income, the safer default: wrongly withholding too much PAYE
 * is a correctable overpayment, wrongly withholding too little risks the
 * tenant under-remitting to FIRS.
 *
 * Benefit-plan premiums (health insurance, group life, ...) are summed
 * across every active BenefitEnrollment the same way NHIS's employee share
 * is: they reduce netPay via totalDeductions but, being voluntary
 * tenant-defined business policy rather than statutory withholding, are
 * treated as post-tax and never reduce taxableIncome. The employer share is
 * cost-only, same treatment as ssnitEmployer/ghanaTier2PensionEmployer -
 * see benefit-contribution.ts (duplicated from benefits-domain, not
 * imported - scope:payroll cannot depend on scope:benefits).
 */
export function computePayslip(input: ComputePayslipInput): ComputedPayslip {
  const earnings = sumLineItems(input.lineItems, PayslipLineItemType.EARNING);
  const otherDeductions = sumLineItems(input.lineItems, PayslipLineItemType.DEDUCTION);

  const basicSalary = roundCurrency(input.basicSalary);
  const grossPay = roundCurrency(basicSalary + earnings);

  const insurableSalary =
    input.countryCode === 'GH'
      ? applyGhanaInsurableEarningsCap(basicSalary)
      : input.countryCode === 'KE'
        ? applyKenyaPensionableEarningsCap(basicSalary)
        : basicSalary;
  const ssnit = calculateSsnit(insurableSalary, input.ssnitRates);

  const ghanaTier2PensionEmployer =
    input.countryCode === 'GH' ? roundCurrency(insurableSalary * (input.ghanaTier2Rate ?? 0)) : 0;
  const kenyaShifEmployee =
    input.countryCode === 'KE' ? calculateKenyaShif(grossPay, input.kenyaShifRate ?? 0) : 0;
  const kenyaHousingLevyEmployee =
    input.countryCode === 'KE' ? roundCurrency(grossPay * (input.kenyaHousingLevyEmployeeRate ?? 0)) : 0;
  const kenyaHousingLevyEmployer =
    input.countryCode === 'KE' ? roundCurrency(grossPay * (input.kenyaHousingLevyEmployerRate ?? 0)) : 0;

  const meetsNigeriaEmployerLevyThreshold =
    (input.organizationEmployeeCount ?? 0) >= NIGERIA_EMPLOYER_LEVY_THRESHOLD;
  const nigeriaNsitfEmployer =
    input.countryCode === 'NG' && meetsNigeriaEmployerLevyThreshold
      ? roundCurrency(basicSalary * (input.nigeriaNsitfRate ?? 0))
      : 0;
  const isEligibleForNhis =
    input.countryCode === 'NG' && meetsNigeriaEmployerLevyThreshold && isEligibleForNigeriaNhis(basicSalary);
  const nigeriaNhisEmployee = isEligibleForNhis
    ? roundCurrency(basicSalary * (input.nigeriaNhisEmployeeRate ?? 0))
    : 0;
  const nigeriaNhisEmployer = isEligibleForNhis
    ? roundCurrency(basicSalary * (input.nigeriaNhisEmployerRate ?? 0))
    : 0;

  const { employeeTotal: benefitsEmployeeDeduction, employerTotal: benefitsEmployerCost } =
    sumBenefitContributions(input.benefitEnrollments ?? [], basicSalary);

  const relief =
    input.countryCode === 'NG' ? calculateNigeriaRentRelief(input.annualRentPaid ?? 0) : 0;
  const taxableIncome = roundCurrency(
    Math.max(0, grossPay - ssnit.employee - relief - kenyaShifEmployee),
  );
  const bandTax = calculatePayeTax(taxableIncome, input.taxBands);
  const payeTax = input.countryCode === 'KE' ? applyKenyaPersonalRelief(bandTax) : bandTax;

  const totalDeductions = roundCurrency(
    ssnit.employee +
      payeTax +
      otherDeductions +
      kenyaShifEmployee +
      kenyaHousingLevyEmployee +
      nigeriaNhisEmployee +
      benefitsEmployeeDeduction,
  );
  const netPay = roundCurrency(grossPay - totalDeductions);

  return {
    basicSalary,
    grossPay,
    taxableIncome,
    payeTax,
    ssnitEmployee: ssnit.employee,
    ssnitEmployer: ssnit.employer,
    ghanaTier2PensionEmployer,
    kenyaShifEmployee,
    kenyaHousingLevyEmployee,
    kenyaHousingLevyEmployer,
    nigeriaNsitfEmployer,
    nigeriaNhisEmployee,
    nigeriaNhisEmployer,
    benefitsEmployeeDeduction,
    benefitsEmployerCost,
    totalDeductions,
    netPay,
  };
}
