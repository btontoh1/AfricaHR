'use client';

import { useSession } from '../../session-provider';
import { CreateCandidateForm } from '@/features/recruitment/create-candidate-form';
import { CandidatesList } from '@/features/recruitment/candidates-list';

export default function CandidatesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Candidates</h1>
      <CreateCandidateForm tenantId={tenantId} />
      <CandidatesList tenantId={tenantId} />
    </div>
  );
}
