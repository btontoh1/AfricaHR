'use client';

import { useSession } from '../../session-provider';
import { ExpensesView } from '@/features/finance/expenses-view';
import { PageHeader } from '@/components/page-header';

export default function ExpensesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Record quick company or employee expenses - no vendor or approval workflow required."
      />
      <ExpensesView tenantId={tenantId} />
    </div>
  );
}
