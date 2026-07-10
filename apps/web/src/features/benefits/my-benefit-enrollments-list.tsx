'use client';

import { toast } from 'sonner';
import { useCancelMyBenefitEnrollment, useMyBenefitEnrollments } from './queries';
import { BenefitEnrollmentStatusBadge } from './benefit-enrollment-status-badge';
import { ContributionCell } from './contribution-cell';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function MyBenefitEnrollmentsList({ tenantId }: { tenantId: string }) {
  const { data: enrollments, isLoading, isError, error } = useMyBenefitEnrollments(tenantId);
  const cancelEnrollment = useCancelMyBenefitEnrollment(tenantId);

  async function handleCancel(id: string) {
    try {
      await cancelEnrollment.mutateAsync(id);
      toast.success('Enrollment cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel enrollment'));
    }
  }

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
        {getApiErrorMessage(error, 'Failed to load your benefit enrollments')}
      </p>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return <p className="text-sm text-muted-foreground">You are not enrolled in any benefits yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Effective date</TableHead>
          <TableHead>Contribution (employee / employer)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrollments.map((enrollment) => (
          <TableRow key={enrollment.id}>
            <TableCell>{enrollment.benefitPlan.name}</TableCell>
            <TableCell>{enrollment.effectiveDate.slice(0, 10)}</TableCell>
            <TableCell>
              <ContributionCell tenantId={tenantId} enrollmentId={enrollment.id} self />
            </TableCell>
            <TableCell>
              <BenefitEnrollmentStatusBadge status={enrollment.status} />
            </TableCell>
            <TableCell>
              {enrollment.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(enrollment.id)}
                  disabled={cancelEnrollment.isPending}
                >
                  Cancel
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
