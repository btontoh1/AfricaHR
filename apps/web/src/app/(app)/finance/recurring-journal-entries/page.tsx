'use client';

import { useSession } from '../../session-provider';
import { RecurringJournalEntriesList } from '@/features/finance/recurring-journal-entries-list';
import { PageHeader } from '@/components/page-header';

export default function RecurringJournalEntriesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Recurring Journal Entries"
        description="Templates that post a journal entry automatically every month, like rent or depreciation."
      />
      <RecurringJournalEntriesList tenantId={tenantId} />
    </div>
  );
}
