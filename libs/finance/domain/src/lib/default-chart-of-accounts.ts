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
  ACCOUNTS_PAYABLE: '2200',
  REVENUE: '4000',
  PAYROLL_EXPENSE: '5000',
  // Every vendor bill posts here regardless of what it's actually for - same
  // "one fixed bucket per source type" convention as PAYROLL_EXPENSE/REVENUE,
  // not a per-category expense chart. See computeVendorBillApprovedJournalLines.
  // Deliberately not '5100' - a tenant's own custom EXPENSE account (created
  // via GlAccountRepository.create, e.g. "Rent Expense") can occupy any code
  // a tenant chooses, and ensureDefaultAccounts's upsert never overwrites an
  // existing row's name - so introducing a new default at an already-taken
  // code would silently misname postings under the tenant's own account
  // instead of seeding a distinct one.
  GENERAL_EXPENSE: '5900',
  // Where FX revaluation's net gain/loss lands - see
  // compute-fx-revaluation.ts. Classified REVENUE (a gain credits it, a
  // loss debits it, same sign convention computeProfitAndLoss already
  // applies to every REVENUE account) rather than a separate gain/loss
  // pair, matching this chart's "one fixed bucket per source type"
  // convention everywhere else.
  FX_GAIN_LOSS: '4900',
  // Cost-basis bucket for every fixed asset combined, not one account per
  // asset - same "one fixed bucket, not one row per real-world thing"
  // convention as GENERAL_EXPENSE. Individual assets are tracked by their
  // own GlFixedAsset row; this account only ever holds the sum of their
  // costs. See compute-fixed-asset-depreciation.ts.
  FIXED_ASSETS: '1500',
  // A contra-asset - carries a credit balance that nets against
  // FIXED_ASSETS on the balance sheet (both are type ASSET; this chart has
  // no separate "contra" type, so the net book value falls out of summing
  // debit-credit across both accounts, same computation every other ASSET
  // account already gets).
  ACCUMULATED_DEPRECIATION: '1550',
  DEPRECIATION_EXPENSE: '5200',
  // Only ever credited for an EMPLOYEE-paid Expense, at creation - the
  // company owes that employee the amount until markExpenseReimbursed
  // debits it back down. Not used for anything vendor-related; VendorBill
  // keeps its own ACCOUNTS_PAYABLE. See compute-expense-journal-lines.ts.
  EXPENSE_REIMBURSEMENTS_PAYABLE: '2300',
} as const;

export type GlAccountCode = (typeof GlAccountCode)[keyof typeof GlAccountCode];

export interface DefaultGlAccount {
  code: GlAccountCode;
  name: string;
  type: GlAccountType;
}

/** A deliberately minimal chart of accounts - just enough to post payroll
 * disbursement, customer invoicing, and vendor bills, and produce a basic
 * P&L/cash-flow report from them. No budgets, no bank reconciliation, no
 * per-authority statutory payable split (PAYE/SSNIT/etc all land in one
 * PAYROLL_LIABILITIES_PAYABLE account) - see the finance domain's
 * compute-payroll-journal-lines.ts for why that single bucket is
 * mathematically guaranteed to balance regardless of which country-specific
 * statutory fields a payslip carries. Same reasoning extends to AP: every
 * vendor bill posts to one GENERAL_EXPENSE account, not a per-category
 * expense chart - see compute-vendor-bill-journal-lines.ts. */
export const DEFAULT_CHART_OF_ACCOUNTS: readonly DefaultGlAccount[] = [
  { code: GlAccountCode.CASH_AND_BANK, name: 'Cash and Bank', type: 'ASSET' },
  { code: GlAccountCode.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', type: 'ASSET' },
  {
    code: GlAccountCode.PAYROLL_LIABILITIES_PAYABLE,
    name: 'Payroll Liabilities Payable',
    type: 'LIABILITY',
  },
  { code: GlAccountCode.TAX_PAYABLE, name: 'Tax Payable', type: 'LIABILITY' },
  { code: GlAccountCode.ACCOUNTS_PAYABLE, name: 'Accounts Payable', type: 'LIABILITY' },
  { code: GlAccountCode.REVENUE, name: 'Revenue', type: 'REVENUE' },
  { code: GlAccountCode.PAYROLL_EXPENSE, name: 'Payroll Expense', type: 'EXPENSE' },
  { code: GlAccountCode.GENERAL_EXPENSE, name: 'General Expense', type: 'EXPENSE' },
  { code: GlAccountCode.FX_GAIN_LOSS, name: 'FX Gain/Loss', type: 'REVENUE' },
  { code: GlAccountCode.FIXED_ASSETS, name: 'Fixed Assets', type: 'ASSET' },
  { code: GlAccountCode.ACCUMULATED_DEPRECIATION, name: 'Accumulated Depreciation', type: 'ASSET' },
  { code: GlAccountCode.DEPRECIATION_EXPENSE, name: 'Depreciation Expense', type: 'EXPENSE' },
  { code: GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE, name: 'Expense Reimbursements Payable', type: 'LIABILITY' },
];

/**
 * The monetary (ASSET/LIABILITY) accounts FX revaluation ever adjusts, each
 * with its own normal-balance direction - see compute-fx-revaluation.ts.
 * Deliberately excludes FIXED_ASSETS/ACCUMULATED_DEPRECIATION - a fixed
 * asset's cost is a historical, non-monetary amount (same reasoning
 * standard accounting uses to exclude PP&E from monetary revaluation),
 * not a foreign-currency claim that moves with the exchange rate.
 */
export const MONETARY_ACCOUNT_TYPES: Readonly<Record<string, 'ASSET' | 'LIABILITY'>> = {
  [GlAccountCode.CASH_AND_BANK]: 'ASSET',
  [GlAccountCode.ACCOUNTS_RECEIVABLE]: 'ASSET',
  [GlAccountCode.PAYROLL_LIABILITIES_PAYABLE]: 'LIABILITY',
  [GlAccountCode.TAX_PAYABLE]: 'LIABILITY',
  [GlAccountCode.ACCOUNTS_PAYABLE]: 'LIABILITY',
  [GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE]: 'LIABILITY',
};
