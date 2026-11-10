'use client';

import { toast } from 'sonner';
import { Tags } from 'lucide-react';
import { useDeleteInventoryCategory, useInventoryCategories, useUpdateInventoryCategory } from './queries';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CategoriesList({ tenantId }: { tenantId: string }) {
  const { data: categories, isLoading, isError, error } = useInventoryCategories(tenantId);
  const updateCategory = useUpdateInventoryCategory(tenantId);
  const deleteCategory = useDeleteInventoryCategory(tenantId);

  const categoryName = (id?: string) => categories?.find((category) => category.id === id)?.name ?? '—';

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateCategory.mutateAsync({ id, isActive });
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update category'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load categories')} />;
  }

  if (!categories || categories.length === 0) {
    return <EmptyState icon={Tags} title="No categories yet" description="Add your first category above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-muted-foreground">{categoryName(category.parentId)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                    disabled={updateCategory.isPending}
                  />
                  <Badge variant={category.isActive ? 'success' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DeleteEntityDialog
                  label={category.name}
                  onDelete={() => deleteCategory.mutateAsync(category.id)}
                  errorMessage="Failed to delete category"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
