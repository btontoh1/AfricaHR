export interface ReversalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

/**
 * Swaps debit/credit on every line - the reversal of a balanced entry is
 * always itself balanced, by construction (same accounts, same amounts,
 * sides flipped), so this can never produce an out-of-balance reversal.
 * Used by FinanceService.voidEntry against the original entry's already-
 * persisted lines (accountId, not accountCode - the account is already
 * resolved by the time something is being reversed).
 */
export function computeReversalJournalLines(lines: readonly ReversalLineInput[]): ReversalLineInput[] {
  return lines.map((line) => ({ accountId: line.accountId, debit: line.credit, credit: line.debit }));
}
