import { GlAccountCode } from './default-chart-of-accounts';
import { JournalLineAmount } from './journal-line-amount';

/** Mirrors Prisma's ExpensePaidBy enum - duplicated rather than imported,
 * same "domain libs stay free of @prisma/client" convention as
 * GlAccountType above. */
export type ExpensePaidBy = 'COMPANY' | 'EMPLOYEE';

export interface ExpenseRecordedAmounts {
  amount: number;
  paidBy: ExpensePaidBy;
}

/**
 * Dr General Expense, always - category is a reporting tag only, not a GL
 * split (see the Expense model's own doc comment). What's credited depends
 * on paidBy: COMPANY credits Cash and Bank directly (money already left the
 * business); EMPLOYEE credits Expense Reimbursements Payable instead, since
 * the company now owes that employee until markExpenseReimbursed settles it.
 */
export function computeExpenseRecordedJournalLines(expense: ExpenseRecordedAmounts): JournalLineAmount[] {
  const creditAccount =
    expense.paidBy === 'COMPANY' ? GlAccountCode.CASH_AND_BANK : GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE;
  return [
    { accountCode: GlAccountCode.GENERAL_EXPENSE, debit: expense.amount, credit: 0 },
    { accountCode: creditAccount, debit: 0, credit: expense.amount },
  ];
}

export interface ExpenseReimbursedAmounts {
  amount: number;
}

/** Dr Expense Reimbursements Payable / Cr Cash and Bank - only ever posted
 * for an EMPLOYEE-paid expense, once, by markExpenseReimbursed. */
export function computeExpenseReimbursedJournalLines(expense: ExpenseReimbursedAmounts): JournalLineAmount[] {
  return [
    { accountCode: GlAccountCode.EXPENSE_REIMBURSEMENTS_PAYABLE, debit: expense.amount, credit: 0 },
    { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: expense.amount },
  ];
}
