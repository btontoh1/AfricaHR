'use client';

import { Badge } from '@/components/ui/badge';
import { useOrganizations, useAllOrganizationUnits } from '@/features/organizations/queries';
import type { AudienceScope } from './types';

interface AudienceTargeted {
  audienceScope: AudienceScope;
  organizationId?: string | null;
  organizationUnitId?: string | null;
}

export function AudienceBadge({ tenantId, item }: { tenantId: string; item: AudienceTargeted }) {
  const { data: organizations } = useOrganizations(tenantId);
  const organizationIds = (organizations ?? []).map((o) => o.id);
  const { data: units } = useAllOrganizationUnits(
    tenantId,
    item.audienceScope === 'ORGANIZATION_UNIT' ? organizationIds : [],
  );

  if (item.audienceScope === 'TENANT') {
    return <Badge variant="secondary">Everyone</Badge>;
  }

  if (item.audienceScope === 'ORGANIZATION') {
    const organization = organizations?.find((o) => o.id === item.organizationId);
    return <Badge variant="secondary">{organization?.legalName ?? 'Company'}</Badge>;
  }

  const unit = units.find((u) => u.id === item.organizationUnitId);
  return <Badge variant="secondary">{unit?.name ?? 'Department'}</Badge>;
}
