import type { components } from '@/lib/api-types';

export type GlAccount = components['schemas']['GlAccountResponseDto'];
export type JournalEntry = components['schemas']['JournalEntryResponseDto'];
export type JournalEntryLine = components['schemas']['JournalEntryLineResponseDto'];
export type CreateManualJournalEntryInput = components['schemas']['CreateManualJournalEntryDto'];
export type ManualJournalEntryLineInput = components['schemas']['ManualJournalEntryLineDto'];
export type UpdateGlAccountInput = components['schemas']['UpdateGlAccountDto'];
export type CreateGlAccountInput = components['schemas']['CreateGlAccountDto'];
export type GlAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
