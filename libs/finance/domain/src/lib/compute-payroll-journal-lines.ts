import { GlAccountCode } from './default-chart-of-accounts';
import { JournalLineAmount } from './journal-line-amount';
import { roundCurrency } from './money';

/**
 * Aggregated across every payslip in a pay run - see PayrollGlPostingListener
 * for where these sums come from (libs/payroll can't be depended on here, so
 * the caller does the summing over Payslip rows and hands us plain totals).
 */
export interface PayRunPayrollTotals {
  /** Sum of grossPay across every payslip. */
  totalGrossPay: number;
  /** Sum of every employer-only statutory/benefit cost across every payslip
   * - ssnitEmployer + ghanaTier2PensionEmployer + kenyaHousingLevyEmployer +
   * nigeriaNsitfEmployer + nigeriaNhisEmployer + benefitsEmployerCost. Per
   * payslip-calculator.ts's own doc comments, none of these are ever
   * deducted from the employee - they're pure additional cost to the
   * company, on top of grossPay. */
  totalEmployerOnlyCost: number;
  /** Sum of netPay across every payslip - the actual cash paid out. */
  totalNetPay: number;
}

/**
 * Posts the true all-in cost of a disbursed pay run as a single balanced
 * entry:
 *
 *   Dr Payroll Expense       = totalGrossPay + totalEmployerOnlyCost
 *   Cr Cash and Bank         = totalNetPay
 *   Cr Payroll Liabilities   = everything else (PAYE, SSNIT, benefits,
 *                              ad-hoc deductions, employer-only statutory
 *                              costs) owed to a third party rather than
 *                              paid directly to the employee
 *
 * This balances for every country/combination payslip-calculator.ts
 * supports, by construction: netPay = grossPay - totalDeductions (every
 * employee-side withholding), and the liabilities line is defined as
 * exactly the remainder (totalExpense - totalNetPay), which algebraically
 * always equals totalDeductions + totalEmployerOnlyCost - see this
 * function's spec for the worked proof. There is no scenario where this
 * entry's debits and credits can drift apart.
 */
export function computePayrollJournalLines(totals: PayRunPayrollTotals): JournalLineAmount[] {
  const totalExpense = roundCurrency(totals.totalGrossPay + totals.totalEmployerOnlyCost);
  const totalNetPay = roundCurrency(totals.totalNetPay);
  const totalLiabilities = roundCurrency(totalExpense - totalNetPay);

  const lines: JournalLineAmount[] = [
    { accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: totalExpense, credit: 0 },
  ];
  if (totalNetPay > 0) {
    lines.push({ accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: totalNetPay });
  }
  if (totalLiabilities > 0) {
    lines.push({
      accountCode: GlAccountCode.PAYROLL_LIABILITIES_PAYABLE,
      debit: 0,
      credit: totalLiabilities,
    });
  }
  return lines;
}
