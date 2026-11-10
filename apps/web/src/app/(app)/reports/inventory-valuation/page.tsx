'use client';

import { useSession } from '../../session-provider';
import { InventoryValuationReport } from '@/features/reporting/inventory-valuation-report';
import { PageHeader } from '@/components/page-header';

export default function InventoryValuationReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Inventory valuation" description="Current value of stock on hand, by warehouse and product." />
      <InventoryValuationReport tenantId={tenantId} />
    </div>
  );
}
