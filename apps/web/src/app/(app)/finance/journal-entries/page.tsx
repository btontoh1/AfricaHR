'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useSession } from '../../session-provider';
import { JournalEntriesList } from '@/features/finance/journal-entries-list';
import { PeriodCloseCard } from '@/features/finance/period-close-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function JournalEntriesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal entries"
        description="Automatic postings from payroll and invoicing, plus manual entries."
        action={
          <Button asChild>
            <Link href="/finance/journal-entries/new">
              <Plus className="size-4" />
              New manual entry
            </Link>
          </Button>
        }
      />
      <PeriodCloseCard tenantId={tenantId} />
      <JournalEntriesList tenantId={tenantId} />
    </div>
  );
}
