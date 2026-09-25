import { z } from 'zod';
import { journalEntryLineFormSchema } from './journal-entry-form-schema';

export const recurringJournalEntryFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  description: z.string().min(1, 'Description is required').max(500),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  dayOfMonth: z.string().min(1, 'Day of month is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  lines: z.array(journalEntryLineFormSchema).min(2, 'Add at least two lines'),
});

export type RecurringJournalEntryFormValues = z.infer<typeof recurringJournalEntryFormSchema>;
