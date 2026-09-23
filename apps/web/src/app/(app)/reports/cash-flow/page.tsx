'use client';

import { useSession } from '../../session-provider';
import { CashFlowReport } from '@/features/finance/cash-flow-report';
import { PageHeader } from '@/components/page-header';

export default function CashFlowReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Cash flow" description="Net change in cash and bank posted to the general ledger." />
      <CashFlowReport tenantId={tenantId} />
    </div>
  );
}
