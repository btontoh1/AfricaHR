'use client';

import { HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { useCancelMyBenefitEnrollment, useMyBenefitEnrollments } from './queries';
import { BenefitEnrollmentStatusBadge } from './benefit-enrollment-status-badge';
import { ContributionCell } from './contribution-cell';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
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
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your benefit enrollments')} />;
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="You are not enrolled in any benefits yet"
        description="Enroll in a plan above to get started."
      />
    );
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">{enrollment.benefitPlan.name}</TableCell>
              <TableCell className="text-muted-foreground">{enrollment.effectiveDate.slice(0, 10)}</TableCell>
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
    </TableCard>
  );
}
