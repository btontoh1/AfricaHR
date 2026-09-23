'use client';

import { useSession } from '../../../session-provider';
import { JournalEntryForm } from '@/features/finance/journal-entry-form';
import { PageHeader } from '@/components/page-header';

export default function NewJournalEntryPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New manual journal entry"
        description="Record activity outside payroll and invoicing."
        backHref="/finance/journal-entries"
      />
      <JournalEntryForm tenantId={tenantId} />
    </div>
  );
}
