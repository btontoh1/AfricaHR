'use client';

import { Badge } from '@/components/ui/badge';
import { useOrganizations, useAllOrganizationUnits } from '@/features/organizations/queries';
import type { Policy } from './types';

export function AudienceBadge({ tenantId, policy }: { tenantId: string; policy: Policy }) {
  const { data: organizations } = useOrganizations(tenantId);
  const organizationIds = (organizations ?? []).map((o) => o.id);
  const { data: units } = useAllOrganizationUnits(
    tenantId,
    policy.audienceScope === 'ORGANIZATION_UNIT' ? organizationIds : [],
  );

  if (policy.audienceScope === 'TENANT') {
    return <Badge variant="secondary">Everyone</Badge>;
  }

  if (policy.audienceScope === 'ORGANIZATION') {
    const organization = organizations?.find((o) => o.id === policy.organizationId);
    return <Badge variant="secondary">{organization?.legalName ?? 'Company'}</Badge>;
  }

  const unit = units.find((u) => u.id === policy.organizationUnitId);
  return <Badge variant="secondary">{unit?.name ?? 'Department'}</Badge>;
}
