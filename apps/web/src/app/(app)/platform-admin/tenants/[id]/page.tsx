'use client';

import { use } from 'react';
import { TenantDetail } from '@/features/platform-tenants/tenant-detail';

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <TenantDetail tenantId={id} />;
}
