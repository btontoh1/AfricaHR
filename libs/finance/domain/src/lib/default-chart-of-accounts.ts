/** Mirrors Prisma's GlAccountType enum - duplicated rather than imported so
 * this domain lib stays free of a @prisma/client dependency, same
 * convention as every other domain lib in this workspace. */
export type GlAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

/** Fixed account codes every posting function below targets by name. Not
 * tenant-editable in v1 - see GlAccountRepository.ensureDefaultAccounts,
 * which seeds exactly these six accounts for a tenant on first use. */
export const GlAccountCode = {
  CASH_AND_BANK: '1000',
  ACCOUNTS_RECEIVABLE: '1100',
  PAYROLL_LIABILITIES_PAYABLE: '2000',
  TAX_PAYABLE: '2100',
  REVENUE: '4000',
  PAYROLL_EXPENSE: '5000',
} as const;

export type GlAccountCode = (typeof GlAccountCode)[keyof typeof GlAccountCode];

export interface DefaultGlAccount {
  code: GlAccountCode;
  name: string;
  type: GlAccountType;
}

/** A deliberately minimal chart of accounts - just enough to post payroll
 * disbursement and customer invoicing and produce a basic P&L/cash-flow
 * report from them. No AP, no budgets, no per-authority statutory payable
 * split (PAYE/SSNIT/etc all land in one PAYROLL_LIABILITIES_PAYABLE account)
 * - see the finance domain's compute-payroll-journal-lines.ts for why that
 * single bucket is mathematically guaranteed to balance regardless of which
 * country-specific statutory fields a payslip carries. */
export const DEFAULT_CHART_OF_ACCOUNTS: readonly DefaultGlAccount[] = [
  { code: GlAccountCode.CASH_AND_BANK, name: 'Cash and Bank', type: 'ASSET' },
  { code: GlAccountCode.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', type: 'ASSET' },
  {
    code: GlAccountCode.PAYROLL_LIABILITIES_PAYABLE,
    name: 'Payroll Liabilities Payable',
    type: 'LIABILITY',
  },
  { code: GlAccountCode.TAX_PAYABLE, name: 'Tax Payable', type: 'LIABILITY' },
  { code: GlAccountCode.REVENUE, name: 'Revenue', type: 'REVENUE' },
  { code: GlAccountCode.PAYROLL_EXPENSE, name: 'Payroll Expense', type: 'EXPENSE' },
];
