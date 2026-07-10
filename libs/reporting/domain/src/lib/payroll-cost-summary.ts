export interface PayslipCostEntry {
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  ssnitEmployer: number;
}

export interface PayrollCostSummary {
  payslipCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  /** Gross pay plus the employer's own SSNIT contribution — the tenant's true cost, not just what employees are paid. */
  totalEmployerCost: number;
}

export function summarizePayrollCosts(entries: PayslipCostEntry[]): PayrollCostSummary {
  return entries.reduce<PayrollCostSummary>(
    (summary, entry) => ({
      payslipCount: summary.payslipCount + 1,
      totalGrossPay: summary.totalGrossPay + entry.grossPay,
      totalNetPay: summary.totalNetPay + entry.netPay,
      totalDeductions: summary.totalDeductions + entry.totalDeductions,
      totalEmployerCost: summary.totalEmployerCost + entry.grossPay + entry.ssnitEmployer,
    }),
    { payslipCount: 0, totalGrossPay: 0, totalNetPay: 0, totalDeductions: 0, totalEmployerCost: 0 },
  );
}
