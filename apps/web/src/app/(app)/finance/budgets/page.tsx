'use client';

import { useSession } from '../../session-provider';
import { BudgetsView } from '@/features/finance/budgets-view';
import { PageHeader } from '@/components/page-header';

export default function BudgetsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="A budgeted amount per account, organization, and fiscal year. See the Budget vs Actual report to track spending against it."
      />
      <BudgetsView tenantId={tenantId} />
    </div>
  );
}
