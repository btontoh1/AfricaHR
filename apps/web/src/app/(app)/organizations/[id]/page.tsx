'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { OrganizationDetail } from '@/features/organizations/organization-detail';

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <OrganizationDetail tenantId={tenantId} organizationId={id} />;
}
