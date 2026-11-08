import { roundCurrency } from './money';

export interface TrialBalanceLineAmount {
  currency: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceAccountRow {
  accountCode: string;
  accountName: string;
  /** Non-zero on exactly one of debit/credit - whichever side the
   * account's net balance falls on. Never both, never neither, since a
   * balance is either a net debit, a net credit, or (rare) exactly zero,
   * in which case both are 0. */
  debit: number;
  credit: number;
}

export interface TrialBalanceByCurrency {
  currency: string;
  accounts: TrialBalanceAccountRow[];
  /** Mathematically guaranteed equal - see computeTrialBalance's own doc
   * comment - this is the "trial" a trial balance proves. */
  totalDebit: number;
  totalCredit: number;
}

/**
 * One row per account that has had any activity, showing its net balance
 * on whichever side (debit or credit) it nets to - unlike a balance
 * sheet/P&L, this doesn't classify by account type at all, it just proves
 * every account's net debit/credit balances sum to the same total, which
 * is guaranteed by every journal entry already being balanced
 * (validate-balanced-entry.ts) - if totalDebit !== totalCredit here,
 * that's a bug elsewhere in the posting pipeline, not something this
 * function can produce on its own.
 *
 * Grouped by currency, never blended - same reasoning as every other
 * finance-domain report function.
 */
export function computeTrialBalance(lines: readonly TrialBalanceLineAmount[]): TrialBalanceByCurrency[] {
  const currencies = [...new Set(lines.map((line) => line.currency))].sort();
  return currencies.map((currency) => {
    const currencyLines = lines.filter((line) => line.currency === currency);

    const totalsByAccount = new Map<string, { accountName: string; debit: number; credit: number }>();
    for (const line of currencyLines) {
      const existing = totalsByAccount.get(line.accountCode) ?? {
        accountName: line.accountName,
        debit: 0,
        credit: 0,
      };
      existing.debit += line.debit;
      existing.credit += line.credit;
      totalsByAccount.set(line.accountCode, existing);
    }

    const accounts: TrialBalanceAccountRow[] = [...totalsByAccount.entries()]
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
      .map(([accountCode, { accountName, debit, credit }]) => {
        const balance = roundCurrency(debit - credit);
        return {
          accountCode,
          accountName,
          debit: balance > 0 ? balance : 0,
          credit: balance < 0 ? -balance : 0,
        };
      });

    return {
      currency,
      accounts,
      totalDebit: roundCurrency(accounts.reduce((sum, account) => sum + account.debit, 0)),
      totalCredit: roundCurrency(accounts.reduce((sum, account) => sum + account.credit, 0)),
    };
  });
}
