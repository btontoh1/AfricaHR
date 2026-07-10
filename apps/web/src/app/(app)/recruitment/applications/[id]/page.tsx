'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { ApplicationDetail } from '@/features/recruitment/application-detail';

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <ApplicationDetail tenantId={tenantId} applicationId={id} tier="hr" />;
}
