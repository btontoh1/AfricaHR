import { summarizePayrollCosts } from './payroll-cost-summary';

describe('summarizePayrollCosts', () => {
  it('returns an empty array for an empty list', () => {
    expect(summarizePayrollCosts([])).toEqual([]);
  });

  it('sums gross, net, deductions, and employer cost within a single currency', () => {
    const result = summarizePayrollCosts([
      { currency: 'GHS', grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
      { currency: 'GHS', grossPay: 5000, netPay: 3900, totalDeductions: 1100, ssnitEmployer: 650, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
    ]);

    expect(result).toEqual([
      {
        currency: 'GHS',
        payslipCount: 2,
        totalGrossPay: 8000,
        totalNetPay: 6300,
        totalDeductions: 1700,
        totalEmployerCost: 9040,
      },
    ]);
  });

  it('keeps different currencies in separate totals instead of blending them together', () => {
    const result = summarizePayrollCosts([
      { currency: 'GHS', grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
      { currency: 'NGN', grossPay: 100_000, netPay: 91_200, totalDeductions: 8800, ssnitEmployer: 10_000, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
      { currency: 'GHS', grossPay: 5000, netPay: 3900, totalDeductions: 1100, ssnitEmployer: 650, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
    ]);

    expect(result).toEqual([
      {
        currency: 'GHS',
        payslipCount: 2,
        totalGrossPay: 8000,
        totalNetPay: 6300,
        totalDeductions: 1700,
        totalEmployerCost: 9040,
      },
      {
        currency: 'NGN',
        payslipCount: 1,
        totalGrossPay: 100_000,
        totalNetPay: 91_200,
        totalDeductions: 8800,
        totalEmployerCost: 110_000,
      },
    ]);
  });

  it('orders currency groups alphabetically regardless of input order', () => {
    const result = summarizePayrollCosts([
      { currency: 'NGN', grossPay: 1, netPay: 1, totalDeductions: 0, ssnitEmployer: 0, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
      { currency: 'GHS', grossPay: 1, netPay: 1, totalDeductions: 0, ssnitEmployer: 0, ghanaTier2PensionEmployer: 0, kenyaHousingLevyEmployer: 0, nigeriaNsitfEmployer: 0, nigeriaNhisEmployer: 0, benefitsEmployerCost: 0 },
    ]);

    expect(result.map((r) => r.currency)).toEqual(['GHS', 'NGN']);
  });

  it("includes Ghana Tier 2 and Kenya's Housing Levy employer shares in total employer cost", () => {
    const result = summarizePayrollCosts([
      {
        currency: 'GHS',
        grossPay: 3000,
        netPay: 2400,
        totalDeductions: 600,
        ssnitEmployer: 390,
        ghanaTier2PensionEmployer: 150,
        kenyaHousingLevyEmployer: 0,
        nigeriaNsitfEmployer: 0,
        nigeriaNhisEmployer: 0, benefitsEmployerCost: 0,
      },
      {
        currency: 'KES',
        grossPay: 50_000,
        netPay: 38_804.15,
        totalDeductions: 11195.85,
        ssnitEmployer: 3000,
        ghanaTier2PensionEmployer: 0,
        kenyaHousingLevyEmployer: 750,
        nigeriaNsitfEmployer: 0,
        nigeriaNhisEmployer: 0, benefitsEmployerCost: 0,
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ currency: 'GHS', totalEmployerCost: 3000 + 390 + 150 }),
      expect.objectContaining({ currency: 'KES', totalEmployerCost: 50_000 + 3000 + 750 }),
    ]);
  });

  it("includes Nigeria's NSITF and NHIS employer shares in total employer cost", () => {
    const result = summarizePayrollCosts([
      {
        currency: 'NGN',
        grossPay: 100_000,
        netPay: 83_200,
        totalDeductions: 16_800,
        ssnitEmployer: 10_000,
        ghanaTier2PensionEmployer: 0,
        kenyaHousingLevyEmployer: 0,
        nigeriaNsitfEmployer: 1000,
        nigeriaNhisEmployer: 10_000, benefitsEmployerCost: 0,
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ currency: 'NGN', totalEmployerCost: 100_000 + 10_000 + 1000 + 10_000 }),
    ]);
  });

  it("includes active benefit enrollments' employer share in total employer cost", () => {
    const result = summarizePayrollCosts([
      {
        currency: 'GHS',
        grossPay: 3000,
        netPay: 2400,
        totalDeductions: 600,
        ssnitEmployer: 390,
        ghanaTier2PensionEmployer: 0,
        kenyaHousingLevyEmployer: 0,
        nigeriaNsitfEmployer: 0,
        nigeriaNhisEmployer: 0,
        benefitsEmployerCost: 90,
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ currency: 'GHS', totalEmployerCost: 3000 + 390 + 90 }),
    ]);
  });
});
