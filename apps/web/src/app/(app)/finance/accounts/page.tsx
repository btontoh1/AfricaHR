'use client';

import { useSession } from '../../session-provider';
import { ChartOfAccountsList } from '@/features/finance/chart-of-accounts-list';
import { CreateAccountDialog } from '@/features/finance/create-account-dialog';
import { PageHeader } from '@/components/page-header';

export default function ChartOfAccountsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Chart of accounts"
        description="Six default accounts every payroll, invoicing, and manual entry posts to, plus any accounts you add for manual entries. Names can be renamed; codes and types are fixed once created."
        action={<CreateAccountDialog tenantId={tenantId} />}
      />
      <ChartOfAccountsList tenantId={tenantId} />
    </div>
  );
}
