'use client';

import { useOrganizations } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OrganizationPicker({
  tenantId,
  value,
  onChange,
  disabled,
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { data: organizations, isLoading } = useOrganizations(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select an organization'} />
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.legalName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
