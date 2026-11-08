'use client';

import { useVendors } from './queries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function VendorPicker({
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
  const { data: vendors, isLoading } = useVendors(tenantId, organizationId || undefined);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || !organizationId || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={!organizationId ? 'Choose an organization first' : isLoading ? 'Loading…' : 'Select a vendor'}
        />
      </SelectTrigger>
      <SelectContent>
        {vendors?.map((vendor) => (
          <SelectItem key={vendor.id} value={vendor.id}>
            {vendor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
