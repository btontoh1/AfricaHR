'use client';

import { useInventoryUnits } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function UnitPicker({
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
  const { data: units, isLoading } = useInventoryUnits(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a unit'} />
      </SelectTrigger>
      <SelectContent>
        {units?.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            {unit.name} ({unit.abbreviation})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
