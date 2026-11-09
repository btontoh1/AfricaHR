'use client';

import { toast } from 'sonner';
import { Package } from 'lucide-react';
import {
  useDeleteInventoryProduct,
  useInventoryCategories,
  useInventoryProducts,
  useInventoryUnits,
  useUpdateInventoryProduct,
} from './queries';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ProductsList({ tenantId }: { tenantId: string }) {
  const { data: products, isLoading, isError, error } = useInventoryProducts(tenantId);
  const { data: units } = useInventoryUnits(tenantId);
  const { data: categories } = useInventoryCategories(tenantId);
  const updateProduct = useUpdateInventoryProduct(tenantId);
  const deleteProduct = useDeleteInventoryProduct(tenantId);

  const unitLabel = (id: string) => units?.find((unit) => unit.id === id)?.abbreviation ?? id;
  const categoryName = (id?: string) => categories?.find((category) => category.id === id)?.name ?? '—';

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateProduct.mutateAsync({ id, isActive });
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update product'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load products')} />;
  }

  if (!products || products.length === 0) {
    return <EmptyState icon={Package} title="No products yet" description="Add your first product above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Base unit</TableHead>
            <TableHead>Purchase price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-muted-foreground">{product.sku}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-muted-foreground">{categoryName(product.categoryId)}</TableCell>
              <TableCell className="text-muted-foreground">{unitLabel(product.baseUnitId)}</TableCell>
              <TableCell className="text-muted-foreground">{Number(product.purchasePrice).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => handleToggleActive(product.id, checked)}
                    disabled={updateProduct.isPending}
                  />
                  <Badge variant={product.isActive ? 'success' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DeleteEntityDialog
                  label={product.name}
                  onDelete={() => deleteProduct.mutateAsync(product.id)}
                  errorMessage="Failed to delete product"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
