'use client';

import { useSession } from '../../session-provider';
import { useInventoryProducts } from '@/features/inventory/queries';
import { CreateProductDialog } from '@/features/inventory/create-product-dialog';
import { ProductsList } from '@/features/inventory/products-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryProductsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: products } = useInventoryProducts(tenantId);

  return (
    <div>
      <PageHeader
        title="Products"
        description={products ? `${products.length} product${products.length === 1 ? '' : 's'}` : undefined}
        action={<CreateProductDialog tenantId={tenantId} />}
      />
      <ProductsList tenantId={tenantId} />
    </div>
  );
}
