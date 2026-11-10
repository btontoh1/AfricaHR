'use client';

import { useSession } from '../../session-provider';
import { ProcurementSpendReport } from '@/features/reporting/procurement-spend-report';
import { PageHeader } from '@/components/page-header';

export default function ProcurementSpendReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Procurement spend" description="Committed spend by vendor and month." />
      <ProcurementSpendReport tenantId={tenantId} />
    </div>
  );
}
