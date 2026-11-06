'use client';

import { useSession } from '../../session-provider';
import { useCostCenters } from '@/features/finance/queries';
import { CreateCostCenterDialog } from '@/features/finance/create-cost-center-dialog';
import { CostCentersList } from '@/features/finance/cost-centers-list';
import { PageHeader } from '@/components/page-header';

export default function CostCentersPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: costCenters } = useCostCenters(tenantId);

  return (
    <div>
      <PageHeader
        title="Cost Centers"
        description={
          costCenters ? `${costCenters.length} cost center${costCenters.length === 1 ? '' : 's'}` : undefined
        }
        action={<CreateCostCenterDialog tenantId={tenantId} />}
      />
      <CostCentersList tenantId={tenantId} />
    </div>
  );
}
