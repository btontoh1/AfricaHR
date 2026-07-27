import { computePayslip, sumLineItems } from './payslip-calculator';
import { TaxBand } from './tax-band';
import { PayslipLineItemType } from './payslip-line-item-type';

const bands: TaxBand[] = [
  { order: 1, lowerBound: 0, upperBound: 500, rate: 0 },
  { order: 2, lowerBound: 500, upperBound: null, rate: 0.2 },
];
const ssnitRates = { employeeRate: 0.055, employerRate: 0.13 };

// Mirrors the seeded 2026 Nigeria Tax Act bands (see seed.ts) for the
// country-specific rent-relief tests below.
const nigeriaBands: TaxBand[] = [
  { order: 1, lowerBound: 0, upperBound: 66666.67, rate: 0 },
  { order: 2, lowerBound: 66666.67, upperBound: 250000, rate: 0.15 },
  { order: 3, lowerBound: 250000, upperBound: 1000000, rate: 0.18 },
  { order: 4, lowerBound: 1000000, upperBound: 2083333.33, rate: 0.21 },
  { order: 5, lowerBound: 2083333.33, upperBound: 4166666.67, rate: 0.23 },
  { order: 6, lowerBound: 4166666.67, upperBound: null, rate: 0.25 },
];
const nigeriaRates = { employeeRate: 0.08, employerRate: 0.1 };

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
      countryCode: 'GH',
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
      countryCode: 'GH',
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
      countryCode: 'GH',
      basicSalary: 0,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    expect(result.taxableIncome).toBe(0);
    expect(result.payeTax).toBe(0);
    expect(result.netPay).toBe(0);
  });

  it('deducts Nigeria\'s Rent Relief Allowance before applying PAYE bands, when rent is on file', () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 100_000,
      annualRentPaid: 1_200_000,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    // gross = 100,000 (no earnings line items)
    expect(result.grossPay).toBe(100_000);
    // pension employee = 100,000 * 0.08 = 8,000
    expect(result.ssnitEmployee).toBe(8000);
    // rent relief = min(20% of 1,200,000, 500,000)/12 = 240,000/12 = 20,000
    // taxable = 100,000 - 8,000 - 20,000 = 72,000
    expect(result.taxableIncome).toBe(72000);
    // PAYE across the progressive bands: 0 (first band, 0%) +
    // 5,333.33*0.15 = 799.9995 -> rounds to 800.00
    expect(result.payeTax).toBe(800);
    expect(result.totalDeductions).toBe(8800);
    expect(result.netPay).toBe(91200);
  });

  it('applies zero Nigeria relief when no rent is on file, rather than guessing', () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 100_000,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    // taxable = 100,000 - 8,000 pension - 0 relief = 92,000
    expect(result.taxableIncome).toBe(92000);
    // PAYE: (92,000-66,666.67)*0.15 = 3,799.9995 -> rounds to 3,800.00
    expect(result.payeTax).toBe(3800);
    expect(result.totalDeductions).toBe(11800);
    expect(result.netPay).toBe(88200);
  });

  it('never applies Nigeria\'s relief allowance to a non-Nigeria payslip', () => {
    const result = computePayslip({
      countryCode: 'GH',
      basicSalary: 100_000,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    // taxable = gross - SSNIT employee only, no relief subtracted
    expect(result.taxableIncome).toBe(100_000 - 100_000 * 0.055);
  });
});
