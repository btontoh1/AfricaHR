'use client';

import { useSession } from '../../session-provider';
import { ProfitAndLossReport } from '@/features/finance/profit-and-loss-report';
import { PageHeader } from '@/components/page-header';

export default function ProfitAndLossReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Profit and loss" description="Revenue and expense posted to the general ledger." />
      <ProfitAndLossReport tenantId={tenantId} />
    </div>
  );
}
