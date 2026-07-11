'use client';

import { useOrganizations } from '@/features/organizations/queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ALL_ORGANIZATIONS = 'ALL';

export function OrganizationFilter({
  tenantId,
  value,
  onChange,
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: organizations } = useOrganizations(tenantId);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_ORGANIZATIONS}>All organizations</SelectItem>
        {organizations?.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.legalName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
