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
  /** Sum of every payslip's disbursement fee (ParotHR's own margin plus
   * Paystack's real transfer cost, see PayRunService.DisbursementFee) -
   * also real cash leaving the same payroll wallet netPay is paid from, so
   * it has to be booked too or this entry's credit to CASH_AND_BANK would
   * understate the actual cash outflow. Defaults to 0 for a pay run with
   * no disbursement fee configured, which reduces to the previous
   * (pre-fee-feature) entry exactly. */
  totalDisbursementFee?: number;
}

/**
 * Posts the true all-in cost of a disbursed pay run as a single balanced
 * entry:
 *
 *   Dr Payroll Expense       = totalGrossPay + totalEmployerOnlyCost
 *   Dr Platform Fees Expense = totalDisbursementFee
 *   Cr Cash and Bank         = totalNetPay + totalDisbursementFee
 *   Cr Payroll Liabilities   = everything else (PAYE, SSNIT, benefits,
 *                              ad-hoc deductions, employer-only statutory
 *                              costs) owed to a third party rather than
 *                              paid directly to the employee
 *
 * This balances for every country/combination payslip-calculator.ts
 * supports, by construction: netPay = grossPay - totalDeductions (every
 * employee-side withholding), and the liabilities line is defined as
 * exactly the remainder (totalPayrollExpense - totalNetPay), which
 * algebraically always equals totalDeductions + totalEmployerOnlyCost -
 * see this function's spec for the worked proof. The fee line is a second,
 * independently-balanced pair (Dr Platform Fees Expense = Cr Cash, both
 * totalDisbursementFee) bolted onto that same entry, so it can never
 * unbalance it. There is no scenario where this entry's debits and
 * credits can drift apart.
 */
export function computePayrollJournalLines(totals: PayRunPayrollTotals): JournalLineAmount[] {
  const totalPayrollExpense = roundCurrency(totals.totalGrossPay + totals.totalEmployerOnlyCost);
  const totalNetPay = roundCurrency(totals.totalNetPay);
  const totalLiabilities = roundCurrency(totalPayrollExpense - totalNetPay);
  const totalDisbursementFee = roundCurrency(totals.totalDisbursementFee ?? 0);
  const totalCash = roundCurrency(totalNetPay + totalDisbursementFee);

  const lines: JournalLineAmount[] = [
    { accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: totalPayrollExpense, credit: 0 },
  ];
  if (totalDisbursementFee > 0) {
    lines.push({ accountCode: GlAccountCode.PLATFORM_FEES_EXPENSE, debit: totalDisbursementFee, credit: 0 });
  }
  if (totalCash > 0) {
    lines.push({ accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: totalCash });
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
