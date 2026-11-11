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
import { computeUnpaidLeaveDeduction } from './unpaid-leave-deduction';
import { computeOvertimePay } from './overtime-pay';
import { PayslipLineItemType } from './payslip-line-item-type';

/** NSITF and NHIA's OPSSHIP both apply only once the employing organization has this many active employees - per public payroll-compliance summaries, not otherwise confirmed against nsitf.gov.ng/nhia.gov.ng directly (blocked by this environment's egress policy). */
const NIGERIA_EMPLOYER_LEVY_THRESHOLD = 5;

export interface PayslipLineItemInput {
  type: PayslipLineItemType;
  amount: number;
}

export interface ComputePayslipInput {
  countryCode: string;
  /** Defaults to 'SALARY' (every call site predating this field). 'HOURLY' takes a wholly different path to basicSalary/overtimePay below - see this function's doc comment. */
  compensationType?: 'SALARY' | 'HOURLY';
  /** Ignored for 'HOURLY' (basicSalary is computed from hourlyRate * hours worked instead - see hourlyRate/totalHoursWorked below). Required for 'SALARY'. */
  basicSalary: number;
  /** HOURLY only - the employee's Employee.hourlyRate. Required whenever compensationType is 'HOURLY'. */
  hourlyRate?: number;
  /** HOURLY only - sum of hoursWorked across every AttendanceRecord falling within the pay period (periodStart/periodEnd below); this already INCLUDES overtimeHours, not on top of it - see PayrollAttendanceRecordRepository.sumHoursWorked. Required whenever compensationType is 'HOURLY'. */
  totalHoursWorked?: number;
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
  /** Sum of daysRequested for every APPROVED leave request on an unpaid LeaveType falling entirely within the pay period (periodStart/periodEnd below) - see PayrollLeaveRequestRepository. Defaults to 0 (no unpaid leave) when omitted. */
  unpaidLeaveDays?: number;
  /** The pay run's period bounds - used to derive unpaidLeaveDays' and overtimeHours' daily/hourly-rate denominators (see unpaid-leave-deduction.ts / overtime-pay.ts). Required whenever unpaidLeaveDays or overtimeHours is nonzero; ignored otherwise. */
  periodStart?: Date;
  periodEnd?: Date;
  /** Sum of overtimeHours across every AttendanceRecord falling within the pay period (periodStart/periodEnd above) - see PayrollAttendanceRecordRepository. Defaults to 0 (no overtime) when omitted. */
  overtimeHours?: number;
  /** The tenant's AttendancePolicy.standardDailyHours, used with periodStart/periodEnd to derive overtimeHours' implied hourly rate (see overtime-pay.ts). Required whenever overtimeHours is nonzero; ignored otherwise. */
  standardDailyHours?: number;
  /** Country-specific overtime premium multiplier (e.g. 1.5 for time-and-a-half) - see OVERTIME_MULTIPLIER in the StatutoryRateCode enum. Required whenever overtimeHours is nonzero; ignored otherwise. */
  overtimeMultiplier?: number;
  lineItems: readonly PayslipLineItemInput[];
  taxBands: readonly TaxBand[];
  ssnitRates: SsnitRates;
}

export interface ComputedPayslip {
  /** The employee's pay-period basic salary, already net of unpaidLeaveDeduction (see that field below) - not always equal to the contracted basicSalary passed in. */
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
  /** Value of unpaidLeaveDays at the pay period's daily rate, else 0. Informational only - unlike benefitsEmployeeDeduction, this is NOT part of totalDeductions; it already reduced basicSalary/grossPay (and therefore taxableIncome) upstream, since it's pay never owed rather than a withholding. See unpaid-leave-deduction.ts. */
  unpaidLeaveDeduction: number;
  /** Value of overtimeHours at the employee's implied (SALARY) or actual (HOURLY) hourly rate times the country's overtime multiplier, else 0. Informational only - unlike benefitsEmployeeDeduction, this is NOT part of totalDeductions; it's extra pay already added into grossPay (and therefore taxableIncome) upstream, not a withholding. See overtime-pay.ts. */
  overtimePay: number;
  /** HOURLY only, else undefined - non-overtime hours worked within the pay period, already priced into basicSalary at hourlyRateApplied. */
  regularHoursWorked?: number;
  /** HOURLY only, else undefined - the hourlyRate this payslip was computed with. */
  hourlyRateApplied?: number;
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
 *
 * Unpaid leave is handled differently from every deduction above: it isn't
 * money withheld from pay owed, it's simply pay never owed in the first
 * place for days not worked. So unpaidLeaveDays reduces basicSalary itself
 * (pro-rated at a daily rate over the pay period's working days - see
 * unpaid-leave-deduction.ts) before anything else runs, which correctly
 * flows through to shrink grossPay, taxableIncome, PAYE, and every
 * statutory contribution computed off basicSalary/grossPay - unlike
 * benefits/NHIS, it is NOT added to totalDeductions (that would double-count
 * it, since it already shrank grossPay upstream). unpaidLeaveDeduction is
 * returned purely for display, same reporting-only role as
 * benefitsEmployerCost.
 *
 * Overtime pay is the opposite correction: extra pay for hours actually
 * worked beyond the tenant's standard daily hours (see overtime-pay.ts),
 * computed off the *contracted* basicSalary (unaffected by any unpaid leave
 * taken elsewhere in the same period - the two are independent corrections)
 * and added into grossPay alongside earnings, so it correctly flows through
 * to taxableIncome/PAYE/every statutory contribution computed off grossPay,
 * same as an EARNING line item would. overtimePay is returned purely for
 * display, same reporting-only role as unpaidLeaveDeduction.
 *
 * HOURLY employees (compensationType: 'HOURLY') skip the basicSalary/
 * overtimePay derivation above entirely: there is no contracted salary to
 * prorate or imply an hourly rate from, since hourlyRate is itself the
 * employee's stored rate. totalHoursWorked (already inclusive of overtime
 * hours - see PayrollAttendanceRecordRepository.sumHoursWorked, NOT on top
 * of it) is split into regularHoursWorked (= totalHoursWorked minus
 * overtimeHours) priced at hourlyRate, and overtimeHours priced at
 * hourlyRate * overtimeMultiplier; basicSalary is just regularHoursWorked's
 * pay. unpaidLeaveDeduction is always 0 for this branch - hours not worked
 * are simply absent from totalHoursWorked already, so applying the SALARY
 * branch's pro-rated deduction on top would double-count the missed time.
 * Everything from grossPay onward (statutory contributions, PAYE, benefits,
 * net pay) is the same pipeline for both branches.
 */
export function computePayslip(input: ComputePayslipInput): ComputedPayslip {
  const earnings = sumLineItems(input.lineItems, PayslipLineItemType.EARNING);
  const otherDeductions = sumLineItems(input.lineItems, PayslipLineItemType.DEDUCTION);

  const isHourly = input.compensationType === 'HOURLY';

  let basicSalary: number;
  let unpaidLeaveDeduction: number;
  let overtimePay: number;
  let regularHoursWorked: number | undefined;
  let hourlyRateApplied: number | undefined;

  if (isHourly) {
    const hourlyRate = input.hourlyRate ?? 0;
    const totalHoursWorked = Math.max(0, input.totalHoursWorked ?? 0);
    const overtimeHours = Math.max(0, Math.min(input.overtimeHours ?? 0, totalHoursWorked));
    regularHoursWorked = roundCurrency(totalHoursWorked - overtimeHours);
    hourlyRateApplied = hourlyRate;
    unpaidLeaveDeduction = 0;
    basicSalary = roundCurrency(regularHoursWorked * hourlyRate);
    overtimePay = roundCurrency(overtimeHours * hourlyRate * (input.overtimeMultiplier ?? 0));
  } else {
    const contractedBasicSalary = roundCurrency(input.basicSalary);
    unpaidLeaveDeduction =
      input.unpaidLeaveDays && input.periodStart && input.periodEnd
        ? computeUnpaidLeaveDeduction(contractedBasicSalary, input.unpaidLeaveDays, input.periodStart, input.periodEnd)
        : 0;
    basicSalary = roundCurrency(Math.max(0, contractedBasicSalary - unpaidLeaveDeduction));
    overtimePay =
      input.overtimeHours && input.periodStart && input.periodEnd && input.standardDailyHours
        ? computeOvertimePay(
            contractedBasicSalary,
            input.overtimeHours,
            input.periodStart,
            input.periodEnd,
            input.standardDailyHours,
            input.overtimeMultiplier ?? 0,
          )
        : 0;
  }
  const grossPay = roundCurrency(basicSalary + earnings + overtimePay);

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
    unpaidLeaveDeduction,
    overtimePay,
    regularHoursWorked,
    hourlyRateApplied,
    totalDeductions,
    netPay,
  };
}
