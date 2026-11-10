'use client';

import { useInventoryWarehouses } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function WarehousePicker({
  tenantId,
  value,
  onChange,
  disabled,
  placeholder = 'Select a warehouse',
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { data: warehouses, isLoading } = useInventoryWarehouses(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {warehouses?.map((warehouse) => (
          <SelectItem key={warehouse.id} value={warehouse.id}>
            {warehouse.name} ({warehouse.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
