'use client';

import { useSession } from '../../session-provider';
import { TrialBalanceReport } from '@/features/finance/trial-balance-report';
import { PageHeader } from '@/components/page-header';

export default function TrialBalanceReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Trial balance" description="Every account's balance as of a given date." />
      <TrialBalanceReport tenantId={tenantId} />
    </div>
  );
}
