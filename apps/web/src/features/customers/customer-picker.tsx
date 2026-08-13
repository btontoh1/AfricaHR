'use client';

import { useCustomers } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CustomerPicker({
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
  const { data: customers, isLoading } = useCustomers(tenantId, organizationId || undefined);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || !organizationId || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={!organizationId ? 'Choose an organization first' : isLoading ? 'Loading…' : 'Select a customer'}
        />
      </SelectTrigger>
      <SelectContent>
        {customers?.map((customer) => (
          <SelectItem key={customer.id} value={customer.id}>
            {customer.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
