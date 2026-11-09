'use client';

import { useSession } from '../../session-provider';
import { useInventoryCategories } from '@/features/inventory/queries';
import { CreateCategoryDialog } from '@/features/inventory/create-category-dialog';
import { CategoriesList } from '@/features/inventory/categories-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryCategoriesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: categories } = useInventoryCategories(tenantId);

  return (
    <div>
      <PageHeader
        title="Categories"
        description={
          categories ? `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}` : undefined
        }
        action={<CreateCategoryDialog tenantId={tenantId} />}
      />
      <CategoriesList tenantId={tenantId} />
    </div>
  );
}
