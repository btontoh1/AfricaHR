import { roundCurrency } from './money';
import { calculatePayeTax, TaxBand } from './tax-band';
import { calculateSsnit, SsnitRates } from './ssnit';
import { calculateNigeriaRentRelief } from './nigeria-rent-relief';
import { applyGhanaInsurableEarningsCap } from './ghana-ssnit-cap';
import { applyKenyaPensionableEarningsCap } from './kenya-nssf-cap';
import { applyKenyaPersonalRelief } from './kenya-personal-relief';
import { calculateKenyaShif } from './kenya-shif';
import { PayslipLineItemType } from './payslip-line-item-type';

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

  const relief =
    input.countryCode === 'NG' ? calculateNigeriaRentRelief(input.annualRentPaid ?? 0) : 0;
  const taxableIncome = roundCurrency(
    Math.max(0, grossPay - ssnit.employee - relief - kenyaShifEmployee),
  );
  const bandTax = calculatePayeTax(taxableIncome, input.taxBands);
  const payeTax = input.countryCode === 'KE' ? applyKenyaPersonalRelief(bandTax) : bandTax;

  const totalDeductions = roundCurrency(
    ssnit.employee + payeTax + otherDeductions + kenyaShifEmployee + kenyaHousingLevyEmployee,
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
    totalDeductions,
    netPay,
  };
}
