import { GlAccountCode } from './default-chart-of-accounts';

/** One debit or credit leg a posting function produces. Exactly one of
 * debit/credit is nonzero - callers persist this straight onto a
 * GlJournalLine row after resolving accountCode to a tenant's GlAccount.id. */
export interface JournalLineAmount {
  accountCode: GlAccountCode;
  debit: number;
  credit: number;
}
