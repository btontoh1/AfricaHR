'use client';

import { useSession } from '../../session-provider';
import { HeadcountReport } from '@/features/reporting/headcount-report';

export default function HeadcountReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Headcount</h1>
      <HeadcountReport tenantId={tenantId} />
    </div>
  );
}
