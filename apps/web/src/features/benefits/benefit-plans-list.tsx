'use client';

import { HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { useBenefitPlans, useUpdateBenefitPlan } from './queries';
import { EditBenefitPlanDialog } from './edit-benefit-plan-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function ToggleActiveButton({ tenantId, id, isActive }: { tenantId: string; id: string; isActive: boolean }) {
  const updatePlan = useUpdateBenefitPlan(tenantId, id);

  async function handleToggle() {
    try {
      await updatePlan.mutateAsync({ isActive: !isActive });
      toast.success(isActive ? 'Plan deactivated' : 'Plan activated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update benefit plan'));
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={updatePlan.isPending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}

// Percentage plans store contribution as a fraction of base salary (e.g.
// 0.02); fixed plans store a flat currency amount — only the former needs
// the *100 + "%" conversion for display.
function formatRate(contributionType: string, value: number | string) {
  const numeric = Number(value);
  return contributionType === 'PERCENTAGE' ? `${(numeric * 100).toFixed(2)}%` : numeric;
}

export function BenefitPlansList({ tenantId }: { tenantId: string }) {
  const { data: plans, isLoading, isError, error } = useBenefitPlans(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load benefit plans')} />;
  }

  if (!plans || plans.length === 0) {
    return <EmptyState icon={HeartHandshake} title="No benefit plans yet" description="Add the first plan above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Employee rate</TableHead>
            <TableHead>Employer rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell className="text-muted-foreground">{plan.code}</TableCell>
              <TableCell className="text-muted-foreground">{plan.contributionType}</TableCell>
              <TableCell>{formatRate(plan.contributionType, plan.employeeContribution)}</TableCell>
              <TableCell>{formatRate(plan.contributionType, plan.employerContribution)}</TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditBenefitPlanDialog tenantId={tenantId} plan={plan} />
                  <ToggleActiveButton tenantId={tenantId} id={plan.id} isActive={plan.isActive} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
