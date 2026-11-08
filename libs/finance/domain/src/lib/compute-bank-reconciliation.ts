import { roundCurrency } from './money';

export interface ClearedLineAmount {
  debit: number;
  credit: number;
}

/**
 * Net balance of every Cash and Bank line marked cleared in a
 * reconciliation - debit increases cash, credit decreases it, same
 * convention as every other asset account. Compared against the bank
 * statement's own ending balance (see isReconciliationBalanced) rather than
 * the GL's full book balance, since the book balance includes outstanding
 * items (a check written but not yet cashed, a deposit not yet processed)
 * that haven't reached the bank yet.
 */
export function computeClearedBalance(lines: readonly ClearedLineAmount[]): number {
  return roundCurrency(lines.reduce((sum, line) => sum + (line.debit - line.credit), 0));
}

/** clearedBalance - statementEndingBalance - zero when the reconciliation balances. */
export function computeReconciliationDifference(clearedBalance: number, statementEndingBalance: number): number {
  return roundCurrency(clearedBalance - statementEndingBalance);
}

export function isReconciliationBalanced(clearedBalance: number, statementEndingBalance: number): boolean {
  return computeReconciliationDifference(clearedBalance, statementEndingBalance) === 0;
}
