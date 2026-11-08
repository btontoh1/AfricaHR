import { z } from 'zod';

export const journalEntryLineFormSchema = z.object({
  accountCode: z.string().min(1, 'Account is required'),
  side: z.enum(['debit', 'credit']),
  amount: z.string().min(1, 'Required'),
});

export type JournalEntryLineFormValues = z.infer<typeof journalEntryLineFormSchema>;

export const journalEntryFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  entryDate: z.string().min(1, 'Entry date is required'),
  description: z.string().min(1, 'Description is required').max(500),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  lines: z.array(journalEntryLineFormSchema).min(2, 'Add at least two lines'),
  organizationUnitId: z.string().optional(),
  costCenterId: z.string().optional(),
});

export type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

export interface JournalEntryBalancePreview {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

/** Client-side preview only - the backend re-validates and is the
 * authoritative check (see FinanceService.createManualEntry), so this just
 * gives the person filling the form live feedback before they submit. */
export function previewJournalEntryBalance(lines: JournalEntryLineFormValues[]): JournalEntryBalancePreview {
  const totalDebit = lines
    .filter((line) => line.side === 'debit')
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const totalCredit = lines
    .filter((line) => line.side === 'credit')
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  return {
    totalDebit,
    totalCredit,
    isBalanced: totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005,
  };
}
