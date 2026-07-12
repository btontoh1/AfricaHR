'use client';

import { useSession } from '../../session-provider';
import { CreateCandidateForm } from '@/features/recruitment/create-candidate-form';
import { CandidatesList } from '@/features/recruitment/candidates-list';
import { PageHeader } from '@/components/page-header';

export default function CandidatesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Candidates" description="Manage the candidate pool for your open roles." />
      <div className="space-y-6">
        <CreateCandidateForm tenantId={tenantId} />
        <CandidatesList tenantId={tenantId} />
      </div>
    </div>
  );
}
