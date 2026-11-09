'use client';

import { useInventoryCategories } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

export function CategoryPicker({
  tenantId,
  value,
  onChange,
  disabled,
  excludeId,
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Exclude this category from the list - used by the category form so a category can't become its own parent. */
  excludeId?: string;
}) {
  const { data: categories, isLoading } = useInventoryCategories(tenantId);

  return (
    <Select
      value={value || NONE}
      onValueChange={(next) => onChange(next === NONE ? '' : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'None'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None</SelectItem>
        {categories
          ?.filter((category) => category.id !== excludeId)
          .map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
