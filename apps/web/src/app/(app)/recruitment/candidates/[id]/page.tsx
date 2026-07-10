'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { CandidateDetail } from '@/features/recruitment/candidate-detail';

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <CandidateDetail tenantId={tenantId} candidateId={id} />;
}
