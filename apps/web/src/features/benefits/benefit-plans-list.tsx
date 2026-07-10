'use client';

import { toast } from 'sonner';
import { useBenefitPlans, useUpdateBenefitPlan } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export function BenefitPlansList({ tenantId }: { tenantId: string }) {
  const { data: plans, isLoading, isError, error } = useBenefitPlans(tenantId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load benefit plans')}
      </p>
    );
  }

  if (!plans || plans.length === 0) {
    return <p className="text-sm text-muted-foreground">No benefit plans yet.</p>;
  }

  return (
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
            <TableCell>{plan.name}</TableCell>
            <TableCell>{plan.code}</TableCell>
            <TableCell>{plan.contributionType}</TableCell>
            <TableCell>{plan.employeeContribution}</TableCell>
            <TableCell>{plan.employerContribution}</TableCell>
            <TableCell>
              <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <ToggleActiveButton tenantId={tenantId} id={plan.id} isActive={plan.isActive} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
