'use client';

import { useSession } from '../../session-provider';
import { RecruitmentPipelineReport } from '@/features/reporting/recruitment-pipeline-report';

export default function RecruitmentPipelineReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Recruitment pipeline</h1>
      <RecruitmentPipelineReport tenantId={tenantId} />
    </div>
  );
}
