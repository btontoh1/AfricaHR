'use client';

import { useSession } from '../../session-provider';
import { useInventoryUnits } from '@/features/inventory/queries';
import { CreateUnitDialog } from '@/features/inventory/create-unit-dialog';
import { UnitsList } from '@/features/inventory/units-list';
import { CreateUnitConversionDialog } from '@/features/inventory/create-unit-conversion-dialog';
import { UnitConversionsList } from '@/features/inventory/unit-conversions-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryUnitsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: units } = useInventoryUnits(tenantId);

  return (
    <div>
      <PageHeader
        title="Units"
        description={units ? `${units.length} unit${units.length === 1 ? '' : 's'}` : undefined}
        action={<CreateUnitDialog tenantId={tenantId} />}
      />
      <UnitsList tenantId={tenantId} />

      <div className="mt-10">
        <PageHeader
          title="Unit conversions"
          description="How larger units convert to smaller ones, e.g. 1 carton = 20 box"
          action={<CreateUnitConversionDialog tenantId={tenantId} />}
        />
        <UnitConversionsList tenantId={tenantId} />
      </div>
    </div>
  );
}
