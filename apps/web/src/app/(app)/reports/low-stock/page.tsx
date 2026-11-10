'use client';

import { useSession } from '../../session-provider';
import { LowStockReport } from '@/features/reporting/low-stock-report';
import { PageHeader } from '@/components/page-header';

export default function LowStockReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Low stock" description="Products currently below their minimum stock level." />
      <LowStockReport tenantId={tenantId} />
    </div>
  );
}
