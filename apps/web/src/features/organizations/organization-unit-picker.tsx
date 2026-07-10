'use client';

import { useOrganizationUnits } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

export function OrganizationUnitPicker({
  tenantId,
  organizationId,
  value,
  onChange,
  disabled,
}: {
  tenantId: string;
  organizationId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { data: units, isLoading } = useOrganizationUnits(tenantId, organizationId);

  return (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(next) => onChange(next === NONE_VALUE ? '' : next)}
      disabled={disabled || !organizationId || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={!organizationId ? 'Select an organization first' : 'No unit (optional)'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>No unit</SelectItem>
        {units?.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            {unit.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
