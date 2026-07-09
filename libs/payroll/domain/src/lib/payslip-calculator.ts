import { roundCurrency } from './money';
import { calculatePayeTax, TaxBand } from './tax-band';
import { calculateSsnit, SsnitRates } from './ssnit';
import { PayslipLineItemType } from './payslip-line-item-type';

export interface PayslipLineItemInput {
  type: PayslipLineItemType;
  amount: number;
}

export interface ComputePayslipInput {
  basicSalary: number;
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
 * Computes one employee's payslip for a pay run. SSNIT's employee
 * contribution is deducted from gross pay before PAYE is calculated —
 * that ordering is standard Ghanaian payroll mechanics (not a rate that
 * changes with policy), so it's encoded here rather than left as data.
 */
export function computePayslip(input: ComputePayslipInput): ComputedPayslip {
  const earnings = sumLineItems(input.lineItems, PayslipLineItemType.EARNING);
  const otherDeductions = sumLineItems(input.lineItems, PayslipLineItemType.DEDUCTION);

  const basicSalary = roundCurrency(input.basicSalary);
  const grossPay = roundCurrency(basicSalary + earnings);

  const ssnit = calculateSsnit(basicSalary, input.ssnitRates);
  const taxableIncome = roundCurrency(Math.max(0, grossPay - ssnit.employee));
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
