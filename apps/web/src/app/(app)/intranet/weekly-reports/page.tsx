'use client';

import { useSession } from '../../session-provider';
import { WeeklyReportTemplateDialog } from '@/features/intranet/weekly-report-template-dialog';
import { WeeklyReportsReviewList } from '@/features/intranet/weekly-reports-review-list';
import { PageHeader } from '@/components/page-header';

export default function WeeklyReportsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const isUnitAdmin = session.role === 'UNIT_ADMIN';

  return (
    <div>
      <PageHeader
        title="Weekly Reports"
        description="Review your team's weekly updates and leave comments."
        action={!isUnitAdmin ? <WeeklyReportTemplateDialog tenantId={tenantId} /> : undefined}
      />
      <WeeklyReportsReviewList tenantId={tenantId} />
    </div>
  );
}
