'use client';

import { useSession } from '../../session-provider';
import { ChartOfAccountsList } from '@/features/finance/chart-of-accounts-list';
import { PageHeader } from '@/components/page-header';

export default function ChartOfAccountsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Chart of accounts"
        description="Fixed set of accounts every payroll, invoicing, and manual entry posts to."
      />
      <ChartOfAccountsList tenantId={tenantId} />
    </div>
  );
}
