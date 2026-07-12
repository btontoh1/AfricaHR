'use client';

import { useSession } from '../../session-provider';
import { HeadcountReport } from '@/features/reporting/headcount-report';
import { PageHeader } from '@/components/page-header';

export default function HeadcountReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Headcount" description="Employee counts by organization and status." />
      <HeadcountReport tenantId={tenantId} />
    </div>
  );
}
