'use client';

import { useInventoryProducts } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProductPicker({
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
  const { data: products, isLoading } = useInventoryProducts(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a product'} />
      </SelectTrigger>
      <SelectContent>
        {products?.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.sku} — {product.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
