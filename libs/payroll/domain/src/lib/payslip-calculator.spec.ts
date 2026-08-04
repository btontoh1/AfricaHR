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

// Mirrors the seeded 2026 Kenya PAYE bands (see seed.ts) for the
// country-specific NSSF-cap/personal-relief tests below.
const kenyaBands: TaxBand[] = [
  { order: 1, lowerBound: 0, upperBound: 24000, rate: 0.1 },
  { order: 2, lowerBound: 24000, upperBound: 32333, rate: 0.25 },
  { order: 3, lowerBound: 32333, upperBound: 500000, rate: 0.3 },
  { order: 4, lowerBound: 500000, upperBound: 800000, rate: 0.325 },
  { order: 5, lowerBound: 800000, upperBound: null, rate: 0.35 },
];
const kenyaRates = { employeeRate: 0.06, employerRate: 0.06 };

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
      // Deliberately under the GHS 69,000 SSNIT cap, so this test only
      // exercises the relief-country-gating, not the cap below.
      basicSalary: 50_000,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    // taxable = gross - SSNIT employee only, no relief subtracted
    expect(result.taxableIncome).toBe(50_000 - 50_000 * 0.055);
  });

  it("caps SSNIT to Ghana's maximum insurable earnings, but still taxes the full salary", () => {
    const result = computePayslip({
      countryCode: 'GH',
      basicSalary: 80_000,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    // SSNIT computed on the capped GHS 69,000, not the full 80,000
    expect(result.ssnitEmployee).toBe(69_000 * 0.055);
    expect(result.ssnitEmployer).toBe(69_000 * 0.13);
    // PAYE's taxable income still starts from the full 80,000 gross pay -
    // the cap only affects SSNIT, not what's taxable.
    expect(result.taxableIncome).toBe(80_000 - 69_000 * 0.055);
  });

  it("does not cap SSNIT for a non-Ghana payslip, even above Ghana's ceiling", () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 80_000,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    // pension computed on the full 80,000 - Ghana's cap never applies here
    expect(result.ssnitEmployee).toBe(80_000 * 0.08);
    expect(result.ssnitEmployer).toBe(80_000 * 0.1);
  });

  it("subtracts Kenya's flat personal relief from the PAYE bands' output, and caps NSSF at the UEL", () => {
    const result = computePayslip({
      countryCode: 'KE',
      basicSalary: 100_000,
      kenyaShifRate: 0.0275,
      lineItems: [],
      taxBands: kenyaBands,
      ssnitRates: kenyaRates,
    });

    // NSSF employee = 100,000 * 0.06 = 6,000 (under the 108,000 UEL, uncapped)
    expect(result.ssnitEmployee).toBe(6000);
    expect(result.ssnitEmployer).toBe(6000);
    // SHIF = 100,000 * 0.0275 = 2,750 (above the KES 300 floor)
    expect(result.kenyaShifEmployee).toBe(2750);
    // taxable = 100,000 - 6,000 (NSSF) - 2,750 (SHIF) = 91,250
    expect(result.taxableIncome).toBe(91250);
    // bands: 24,000*0.10 + 8,333*0.25 + 58,917*0.30 = 2,400 + 2,083.25 + 17,675.10 = 22,158.35
    // relief: 22,158.35 - 2,400 = 19,758.35
    expect(result.payeTax).toBe(19758.35);
    // total = NSSF(6,000) + PAYE(19,758.35) + SHIF(2,750) = 28,508.35
    expect(result.totalDeductions).toBe(28508.35);
    expect(result.netPay).toBe(71491.65);
  });

  it("floors Kenya's PAYE at zero when the personal relief exceeds the band tax, rather than refunding", () => {
    const result = computePayslip({
      countryCode: 'KE',
      basicSalary: 20_000,
      kenyaShifRate: 0.0275,
      lineItems: [],
      taxBands: kenyaBands,
      ssnitRates: kenyaRates,
    });

    // NSSF = 20,000*0.06 = 1,200; SHIF = 20,000*0.0275 = 550
    // taxable = 20,000 - 1,200 - 550 = 18,250; band tax = 18,250*0.10 = 1,825
    // relief (2,400) exceeds it, so PAYE floors at 0 rather than going negative
    expect(result.payeTax).toBe(0);
  });

  it("caps NSSF to Kenya's upper earnings limit, but still taxes the full salary", () => {
    const result = computePayslip({
      countryCode: 'KE',
      basicSalary: 150_000,
      kenyaShifRate: 0.0275,
      lineItems: [],
      taxBands: kenyaBands,
      ssnitRates: kenyaRates,
    });

    // NSSF computed on the capped KES 108,000, not the full 150,000
    expect(result.ssnitEmployee).toBe(108_000 * 0.06);
    expect(result.ssnitEmployer).toBe(108_000 * 0.06);
    // SHIF is computed on the uncapped 150,000 gross - NSSF's UEL doesn't apply to it
    expect(result.kenyaShifEmployee).toBe(4125);
    // taxable income still starts from the full 150,000 gross pay
    expect(result.taxableIncome).toBe(150_000 - 108_000 * 0.06 - 4125);
  });

  it("never applies Kenya's NSSF cap or personal relief to a non-Kenya payslip", () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 150_000,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    // pension computed on the full 150,000 - Kenya's NSSF cap never applies here
    expect(result.ssnitEmployee).toBe(150_000 * 0.08);

    const smallTaxResult = computePayslip({
      countryCode: 'GH',
      basicSalary: 600,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    // PAYE (13.4) is well under Kenya's 2,400 relief - if that relief leaked
    // into a non-Kenya payslip, this would floor to 0 instead.
    expect(smallTaxResult.payeTax).toBe(13.4);
  });

  it("computes Ghana Tier 2 as a pure employer cost that never reduces net pay", () => {
    const withoutTier2 = computePayslip({
      countryCode: 'GH',
      basicSalary: 50_000,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });
    const withTier2 = computePayslip({
      countryCode: 'GH',
      basicSalary: 50_000,
      ghanaTier2Rate: 0.05,
      lineItems: [],
      taxBands: bands,
      ssnitRates,
    });

    expect(withTier2.ghanaTier2PensionEmployer).toBe(50_000 * 0.05);
    // Tier 2 doesn't touch taxable income, total deductions, or net pay
    expect(withTier2.taxableIncome).toBe(withoutTier2.taxableIncome);
    expect(withTier2.totalDeductions).toBe(withoutTier2.totalDeductions);
    expect(withTier2.netPay).toBe(withoutTier2.netPay);
  });

  it('never computes Ghana Tier 2 for a non-Ghana payslip', () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 50_000,
      ghanaTier2Rate: 0.05,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    expect(result.ghanaTier2PensionEmployer).toBe(0);
  });

  it("computes Kenya's SHIF and Housing Levy, with SHIF reducing taxable income and Housing Levy not", () => {
    const result = computePayslip({
      countryCode: 'KE',
      basicSalary: 50_000,
      kenyaShifRate: 0.0275,
      kenyaHousingLevyEmployeeRate: 0.015,
      kenyaHousingLevyEmployerRate: 0.015,
      lineItems: [],
      taxBands: kenyaBands,
      ssnitRates: kenyaRates,
    });

    // SHIF = 50,000 * 0.0275 = 1,375 (above the KES 300 floor)
    expect(result.kenyaShifEmployee).toBe(1375);
    // Housing Levy: 1.5% each side
    expect(result.kenyaHousingLevyEmployee).toBe(750);
    expect(result.kenyaHousingLevyEmployer).toBe(750);
    // taxable = 50,000 - NSSF(3,000) - SHIF(1,375) = 45,625 - Housing Levy does NOT reduce this
    expect(result.taxableIncome).toBe(45625);
    // bands: 2,400 + 2,083.25 + 13,292*0.30(3,987.60) = 8,470.85; relief: 8,470.85 - 2,400 = 6,070.85
    expect(result.payeTax).toBe(6070.85);
    // total = NSSF(3,000) + PAYE(6,070.85) + SHIF(1,375) + Housing Levy employee(750) = 11,195.85
    expect(result.totalDeductions).toBe(11195.85);
    expect(result.netPay).toBe(38804.15);
  });

  it("floors Kenya's SHIF at KES 300 for low earners", () => {
    const result = computePayslip({
      countryCode: 'KE',
      basicSalary: 5_000,
      kenyaShifRate: 0.0275,
      lineItems: [],
      taxBands: kenyaBands,
      ssnitRates: kenyaRates,
    });

    // 5,000 * 0.0275 = 137.50, floored to the KES 300 minimum
    expect(result.kenyaShifEmployee).toBe(300);
  });

  it('never computes SHIF or Housing Levy for a non-Kenya payslip', () => {
    const result = computePayslip({
      countryCode: 'NG',
      basicSalary: 50_000,
      kenyaShifRate: 0.0275,
      kenyaHousingLevyEmployeeRate: 0.015,
      kenyaHousingLevyEmployerRate: 0.015,
      lineItems: [],
      taxBands: nigeriaBands,
      ssnitRates: nigeriaRates,
    });

    expect(result.kenyaShifEmployee).toBe(0);
    expect(result.kenyaHousingLevyEmployee).toBe(0);
    expect(result.kenyaHousingLevyEmployer).toBe(0);
  });
});
