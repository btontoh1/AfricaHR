import { GlAccountCode, MONETARY_ACCOUNT_TYPES } from './default-chart-of-accounts';
import { JournalLineAmount } from './journal-line-amount';
import { roundCurrency } from './money';

export interface MonetaryAccountBalance {
  accountCode: GlAccountCode;
  /** Signed per the account's own normal-balance convention - debit-positive
   * for an ASSET, credit-positive for a LIABILITY (see MONETARY_ACCOUNT_TYPES). */
  balance: number;
}

/** null when there's no previous rate to compare against - see
 * GlFxRevaluation's own doc comment for why the very first revaluation run
 * for an organization/currency only ever establishes a baseline rate,
 * never computes or posts a gain/loss. */
export function computeRateDelta(currentRate: number, previousRate: number | null): number | null {
  if (previousRate === null) {
    return null;
  }
  return currentRate - previousRate;
}

export interface FxRevaluationResult {
  /** Empty when every balance is zero or the rate hasn't moved - callers
   * skip posting in that case. */
  lines: JournalLineAmount[];
  netGainLoss: number;
}

/**
 * One adjustment line per monetary account whose balance in this currency
 * is nonzero, plus one net FX_GAIN_LOSS offset line closing the entry -
 * see MONETARY_ACCOUNT_TYPES for why an ASSET account is debited on a gain
 * (its home-currency value rose) while a LIABILITY account is credited on
 * a loss (what's owed rose) - the opposite pairing. When gains on some
 * accounts exactly offset losses on others, netGainLoss lands on zero and
 * the monetary lines alone already balance, so no FX_GAIN_LOSS line is
 * added at all.
 */
export function computeFxRevaluationLines(
  balances: readonly MonetaryAccountBalance[],
  rateDelta: number,
): FxRevaluationResult {
  const lines: JournalLineAmount[] = [];
  let netGainLoss = 0;

  for (const { accountCode, balance } of balances) {
    if (balance === 0 || rateDelta === 0) {
      continue;
    }
    const adjustment = roundCurrency(balance * rateDelta);
    if (adjustment === 0) {
      continue;
    }

    const accountType = MONETARY_ACCOUNT_TYPES[accountCode];
    const amount = Math.abs(adjustment);
    const isGainForEntity = accountType === 'ASSET' ? adjustment > 0 : adjustment < 0;

    if (accountType === 'ASSET') {
      lines.push({ accountCode, debit: adjustment > 0 ? amount : 0, credit: adjustment > 0 ? 0 : amount });
    } else {
      lines.push({ accountCode, debit: adjustment > 0 ? 0 : amount, credit: adjustment > 0 ? amount : 0 });
    }
    netGainLoss += isGainForEntity ? amount : -amount;
  }

  if (lines.length === 0) {
    return { lines: [], netGainLoss: 0 };
  }

  netGainLoss = roundCurrency(netGainLoss);
  if (netGainLoss !== 0) {
    lines.push({
      accountCode: GlAccountCode.FX_GAIN_LOSS,
      debit: netGainLoss < 0 ? Math.abs(netGainLoss) : 0,
      credit: netGainLoss > 0 ? netGainLoss : 0,
    });
  }

  return { lines, netGainLoss };
}
