'use client';

import { useSession } from '../../session-provider';
import { AssetRegisterReport } from '@/features/reporting/asset-register-report';
import { PageHeader } from '@/components/page-header';

export default function AssetRegisterReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Asset register" description="Company assets by status, category, and assignee." />
      <AssetRegisterReport tenantId={tenantId} />
    </div>
  );
}
