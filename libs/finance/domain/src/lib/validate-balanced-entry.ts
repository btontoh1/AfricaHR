export interface BalanceCheckLine {
  debit: number;
  credit: number;
}

/** Half a cent - tolerates floating-point summation noise across many lines
 * without accepting a genuinely unbalanced entry (which would always be off
 * by at least a full cent in practice). */
const BALANCE_TOLERANCE = 0.005;

/** Used for manual journal entries, which - unlike the automatic payroll/
 * invoicing postings above - are hand-entered and have no algebraic
 * guarantee of balancing. FinanceService rejects any manual entry this
 * returns false for. */
export function isBalancedEntry(lines: readonly BalanceCheckLine[]): boolean {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(totalDebit - totalCredit) < BALANCE_TOLERANCE;
}
