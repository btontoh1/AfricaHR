import { GlAccountCode } from './default-chart-of-accounts';
import { computeFxRevaluationLines, computeRateDelta } from './compute-fx-revaluation';

describe('computeRateDelta', () => {
  it('returns null when there is no previous rate (first revaluation)', () => {
    expect(computeRateDelta(11, null)).toBeNull();
  });

  it('returns the difference between current and previous rate', () => {
    expect(computeRateDelta(11, 10)).toBe(1);
    expect(computeRateDelta(9, 10)).toBe(-1);
  });
});

describe('computeFxRevaluationLines', () => {
  it('returns no lines when the rate has not moved', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.CASH_AND_BANK, balance: 1000 }],
      0,
    );
    expect(result).toEqual({ lines: [], netGainLoss: 0 });
  });

  it('returns no lines when every balance is zero', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.CASH_AND_BANK, balance: 0 }],
      1,
    );
    expect(result).toEqual({ lines: [], netGainLoss: 0 });
  });

  it('debits an ASSET account on a gain (rate rose) and credits FX_GAIN_LOSS', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.CASH_AND_BANK, balance: 1000 }],
      1,
    );
    expect(result).toEqual({
      lines: [
        { accountCode: GlAccountCode.CASH_AND_BANK, debit: 1000, credit: 0 },
        { accountCode: GlAccountCode.FX_GAIN_LOSS, debit: 0, credit: 1000 },
      ],
      netGainLoss: 1000,
    });
  });

  it('credits an ASSET account on a loss (rate fell) and debits FX_GAIN_LOSS', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.CASH_AND_BANK, balance: 1000 }],
      -1,
    );
    expect(result).toEqual({
      lines: [
        { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: 1000 },
        { accountCode: GlAccountCode.FX_GAIN_LOSS, debit: 1000, credit: 0 },
      ],
      netGainLoss: -1000,
    });
  });

  it('credits a LIABILITY account on a loss (rate rose - owe more) and debits FX_GAIN_LOSS', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.ACCOUNTS_PAYABLE, balance: 1000 }],
      1,
    );
    expect(result).toEqual({
      lines: [
        { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 0, credit: 1000 },
        { accountCode: GlAccountCode.FX_GAIN_LOSS, debit: 1000, credit: 0 },
      ],
      netGainLoss: -1000,
    });
  });

  it('debits a LIABILITY account on a gain (rate fell - owe less) and credits FX_GAIN_LOSS', () => {
    const result = computeFxRevaluationLines(
      [{ accountCode: GlAccountCode.ACCOUNTS_PAYABLE, balance: 1000 }],
      -1,
    );
    expect(result).toEqual({
      lines: [
        { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 1000, credit: 0 },
        { accountCode: GlAccountCode.FX_GAIN_LOSS, debit: 0, credit: 1000 },
      ],
      netGainLoss: 1000,
    });
  });

  it('omits the FX_GAIN_LOSS line when an asset gain exactly offsets a liability loss', () => {
    const result = computeFxRevaluationLines(
      [
        { accountCode: GlAccountCode.CASH_AND_BANK, balance: 1000 },
        { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, balance: 1000 },
      ],
      1,
    );
    expect(result.netGainLoss).toBe(0);
    expect(result.lines).toEqual([
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 1000, credit: 0 },
      { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, debit: 0, credit: 1000 },
    ]);
    const totalDebit = result.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = result.lines.reduce((sum, line) => sum + line.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });

  it('skips an account whose balance is zero while still adjusting the others', () => {
    const result = computeFxRevaluationLines(
      [
        { accountCode: GlAccountCode.CASH_AND_BANK, balance: 1000 },
        { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, balance: 0 },
      ],
      0.5,
    );
    expect(result.lines).toEqual([
      { accountCode: GlAccountCode.CASH_AND_BANK, debit: 500, credit: 0 },
      { accountCode: GlAccountCode.FX_GAIN_LOSS, debit: 0, credit: 500 },
    ]);
  });

  it('every returned entry balances (total debit equals total credit)', () => {
    const result = computeFxRevaluationLines(
      [
        { accountCode: GlAccountCode.CASH_AND_BANK, balance: 2500 },
        { accountCode: GlAccountCode.ACCOUNTS_RECEIVABLE, balance: 750 },
        { accountCode: GlAccountCode.ACCOUNTS_PAYABLE, balance: 1200 },
      ],
      0.35,
    );
    const totalDebit = result.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = result.lines.reduce((sum, line) => sum + line.credit, 0);
    expect(totalDebit).toBeCloseTo(totalCredit, 2);
  });
});
