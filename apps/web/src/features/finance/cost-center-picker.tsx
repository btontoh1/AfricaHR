'use client';

import { useCostCenters } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

export function CostCenterPicker({
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
  const { data: costCenters, isLoading } = useCostCenters(tenantId, organizationId || undefined);

  return (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(next) => onChange(next === NONE_VALUE ? '' : next)}
      disabled={disabled || !organizationId || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={!organizationId ? 'Select an organization first' : 'No cost center (optional)'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>No cost center</SelectItem>
        {costCenters?.map((costCenter) => (
          <SelectItem key={costCenter.id} value={costCenter.id}>
            {costCenter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
