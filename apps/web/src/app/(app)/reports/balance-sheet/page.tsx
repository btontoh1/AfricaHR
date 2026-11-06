'use client';

import { useSession } from '../../session-provider';
import { BalanceSheetReport } from '@/features/finance/balance-sheet-report';
import { PageHeader } from '@/components/page-header';

export default function BalanceSheetReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Balance sheet" description="Assets, liabilities, and equity as of a given date." />
      <BalanceSheetReport tenantId={tenantId} />
    </div>
  );
}
