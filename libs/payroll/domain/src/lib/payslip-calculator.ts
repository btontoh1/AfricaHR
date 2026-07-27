import { roundCurrency } from './money';
import { calculatePayeTax, TaxBand } from './tax-band';
import { calculateSsnit, SsnitRates } from './ssnit';
import { calculateNigeriaRentRelief } from './nigeria-rent-relief';
import { applyGhanaInsurableEarningsCap } from './ghana-ssnit-cap';
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
 * taxable, just no longer accrue SSNIT.
 */
export function computePayslip(input: ComputePayslipInput): ComputedPayslip {
  const earnings = sumLineItems(input.lineItems, PayslipLineItemType.EARNING);
  const otherDeductions = sumLineItems(input.lineItems, PayslipLineItemType.DEDUCTION);

  const basicSalary = roundCurrency(input.basicSalary);
  const grossPay = roundCurrency(basicSalary + earnings);

  const insurableSalary =
    input.countryCode === 'GH' ? applyGhanaInsurableEarningsCap(basicSalary) : basicSalary;
  const ssnit = calculateSsnit(insurableSalary, input.ssnitRates);
  const relief =
    input.countryCode === 'NG' ? calculateNigeriaRentRelief(input.annualRentPaid ?? 0) : 0;
  const taxableIncome = roundCurrency(Math.max(0, grossPay - ssnit.employee - relief));
  const payeTax = calculatePayeTax(taxableIncome, input.taxBands);

  const totalDeductions = roundCurrency(ssnit.employee + payeTax + otherDeductions);
  const netPay = roundCurrency(grossPay - totalDeductions);

  return {
    basicSalary,
    grossPay,
    taxableIncome,
    payeTax,
    ssnitEmployee: ssnit.employee,
    ssnitEmployer: ssnit.employer,
    totalDeductions,
    netPay,
  };
}
