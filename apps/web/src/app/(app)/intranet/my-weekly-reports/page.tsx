'use client';

import { useSession } from '../../session-provider';
import { SubmitWeeklyReportForm } from '@/features/intranet/submit-weekly-report-form';
import { MyWeeklyReportsHistory } from '@/features/intranet/my-weekly-reports-history';
import { PageHeader } from '@/components/page-header';

export default function MyWeeklyReportsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-8">
      <PageHeader title="My Weekly Report" description="A short update each week: what you did, problems you faced, and your plan for next week." />
      <SubmitWeeklyReportForm tenantId={tenantId} />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">History</h2>
        <MyWeeklyReportsHistory tenantId={tenantId} />
      </div>
    </div>
  );
}
