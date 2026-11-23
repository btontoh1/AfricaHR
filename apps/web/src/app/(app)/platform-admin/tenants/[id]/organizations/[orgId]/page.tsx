'use client';

import { use } from 'react';
import { OrganizationDetail } from '@/features/organizations/organization-detail';

export default function PlatformAdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string; orgId: string }>;
}) {
  const { id, orgId } = use(params);

  return (
    <OrganizationDetail
      tenantId={id}
      organizationId={orgId}
      backHref={`/platform-admin/tenants/${id}`}
    />
  );
}
