import { computePayslip, sumLineItems } from './payslip-calculator';
import { TaxBand } from './tax-band';
import { PayslipLineItemType } from './payslip-line-item-type';

const bands: TaxBand[] = [
  { order: 1, lowerBound: 0, upperBound: 500, rate: 0 },
  { order: 2, lowerBound: 500, upperBound: null, rate: 0.2 },
];
const ssnitRates = { employeeRate: 0.055, employerRate: 0.13 };

describe('sumLineItems', () => {
  it('sums only the requested line item type', () => {
    const lineItems = [
      { type: PayslipLineItemType.EARNING, amount: 100 },
      { type: PayslipLineItemType.EARNING, amount: 50 },
      { type: PayslipLineItemType.DEDUCTION, amount: 30 },
    ];

    expect(sumLineItems(lineItems, PayslipLineItemType.EARNING)).toBe(150);
    expect(sumLineItems(lineItems, PayslipLineItemType.DEDUCTION)).toBe(30);
  });

  it('returns 0 for an empty list', () => {
    expect(sumLineItems([], PayslipLineItemType.EARNING)).toBe(0);
  });
});

describe('computePayslip', () => {
  it('computes gross, SSNIT, PAYE, and net pay with no extra line items', () => {
    const result = computePayslip({
      basicSalary: 1000,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    // gross = 1000 (no earnings line items)
    expect(result.grossPay).toBe(1000);
    // SSNIT employee = 1000 * 0.055 = 55
    expect(result.ssnitEmployee).toBe(55);
    expect(result.ssnitEmployer).toBe(130);
    // taxable income = gross - ssnit employee = 945
    expect(result.taxableIncome).toBe(945);
    // PAYE: first 500 free, remaining 445 * 0.2 = 89
    expect(result.payeTax).toBe(89);
    // total deductions = ssnitEmployee + payeTax = 55 + 89 = 144
    expect(result.totalDeductions).toBe(144);
    // net = gross - total deductions = 1000 - 144 = 856
    expect(result.netPay).toBe(856);
  });

  it('includes earning line items in gross pay and deduction line items in total deductions', () => {
    const result = computePayslip({
      basicSalary: 1000,
      lineItems: [
        { type: PayslipLineItemType.EARNING, amount: 200 },
        { type: PayslipLineItemType.DEDUCTION, amount: 50 },
      ],
      taxBands: bands,
      ssnitRates,
    });

    // gross = 1000 + 200 = 1200
    expect(result.grossPay).toBe(1200);
    // SSNIT still computed on basic salary only, not gross
    expect(result.ssnitEmployee).toBe(55);
    // taxable = 1200 - 55 = 1145; PAYE = (1145-500)*0.2 = 129
    expect(result.taxableIncome).toBe(1145);
    expect(result.payeTax).toBe(129);
    // total deductions = ssnit(55) + paye(129) + other deduction(50) = 234
    expect(result.totalDeductions).toBe(234);
    expect(result.netPay).toBe(966);
  });

  it('never lets taxable income go negative', () => {
    const result = computePayslip({
      basicSalary: 0,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    expect(result.taxableIncome).toBe(0);
    expect(result.payeTax).toBe(0);
    expect(result.netPay).toBe(0);
  });
});
