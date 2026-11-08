'use client';

import { useSession } from '../../../session-provider';
import { RecurringJournalEntryForm } from '@/features/finance/recurring-journal-entry-form';
import { PageHeader } from '@/components/page-header';

export default function NewRecurringJournalEntryPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New recurring journal entry"
        description="Posts automatically on the same day every month until paused, deleted, or its end date passes."
        backHref="/finance/recurring-journal-entries"
      />
      <RecurringJournalEntryForm tenantId={tenantId} />
    </div>
  );
}
