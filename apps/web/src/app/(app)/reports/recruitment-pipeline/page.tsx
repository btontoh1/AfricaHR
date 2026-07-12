'use client';

import { useSession } from '../../session-provider';
import { RecruitmentPipelineReport } from '@/features/reporting/recruitment-pipeline-report';
import { PageHeader } from '@/components/page-header';

export default function RecruitmentPipelineReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Recruitment pipeline" description="Applications by stage across open requisitions." />
      <RecruitmentPipelineReport tenantId={tenantId} />
    </div>
  );
}
