export interface PayslipCostEntry {
  currency: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  ssnitEmployer: number;
  /** Ghana only, else 0. */
  ghanaTier2PensionEmployer: number;
  /** Kenya only, else 0. */
  kenyaHousingLevyEmployer: number;
}

export interface PayrollCostByCurrency {
  currency: string;
  payslipCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  /** Gross pay plus the employer's own pension/levy contributions (SSNIT/NSSF, Ghana Tier 2, Kenya's Housing Levy employer share) — the tenant's true cost, not just what employees are paid. */
  totalEmployerCost: number;
}

/**
 * Grouped by currency rather than blended into one total - a tenant can
 * have employees in more than one country (and therefore currency), and
 * summing e.g. GHS and NGN figures together would silently produce a
 * financially meaningless number. Currencies present are returned in
 * alphabetical order; a period with no payslips returns an empty array
 * rather than a zeroed single summary, since there's no currency to
 * attach zero totals to.
 */
export function summarizePayrollCosts(entries: PayslipCostEntry[]): PayrollCostByCurrency[] {
  const byCurrency = new Map<string, PayrollCostByCurrency>();

  for (const entry of entries) {
    const summary = byCurrency.get(entry.currency) ?? {
      currency: entry.currency,
      payslipCount: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      totalEmployerCost: 0,
    };

    summary.payslipCount += 1;
    summary.totalGrossPay += entry.grossPay;
    summary.totalNetPay += entry.netPay;
    summary.totalDeductions += entry.totalDeductions;
    summary.totalEmployerCost +=
      entry.grossPay + entry.ssnitEmployer + entry.ghanaTier2PensionEmployer + entry.kenyaHousingLevyEmployer;

    byCurrency.set(entry.currency, summary);
  }

  return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}
