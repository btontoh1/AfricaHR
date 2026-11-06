'use client';

import { useSession } from '../../session-provider';
import { BudgetVsActualReport } from '@/features/finance/budget-vs-actual-report';
import { PageHeader } from '@/components/page-header';

export default function BudgetVsActualReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Budget vs actual" description="How actual activity compares to what was budgeted, for a fiscal year." />
      <BudgetVsActualReport tenantId={tenantId} />
    </div>
  );
}
