'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useBenefitEnrollments, useBenefitPlans, useCancelBenefitEnrollment } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { BenefitEnrollmentStatusBadge } from './benefit-enrollment-status-badge';
import { ContributionCell } from './contribution-cell';
import type { BenefitEnrollmentStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ALL = 'ALL';
const STATUS_FILTERS: (BenefitEnrollmentStatus | typeof ALL)[] = [ALL, 'ACTIVE', 'CANCELLED'];

export function BenefitEnrollmentsAdminList({ tenantId }: { tenantId: string }) {
  const [employeeId, setEmployeeId] = useState(ALL);
  const [benefitPlanId, setBenefitPlanId] = useState(ALL);
  const [status, setStatus] = useState<BenefitEnrollmentStatus | typeof ALL>(ALL);

  const { data: employees } = useEmployees(tenantId);
  const { data: plans } = useBenefitPlans(tenantId);
  const { data: enrollments, isLoading, isError, error } = useBenefitEnrollments(tenantId, {
    employeeId: employeeId === ALL ? undefined : employeeId,
    benefitPlanId: benefitPlanId === ALL ? undefined : benefitPlanId,
    status: status === ALL ? undefined : status,
  });
  const cancelEnrollment = useCancelBenefitEnrollment(tenantId);

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  async function handleCancel(id: string) {
    try {
      await cancelEnrollment.mutateAsync(id);
      toast.success('Enrollment cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel enrollment'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All employees</SelectItem>
            {employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={benefitPlanId} onValueChange={setBenefitPlanId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All plans</SelectItem>
            {plans?.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load benefit enrollments')}
        </p>
      )}

      {enrollments && enrollments.length === 0 && (
        <p className="text-sm text-muted-foreground">No enrollments match this filter.</p>
      )}

      {enrollments && enrollments.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
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
                <TableCell>{employeeName(enrollment.employeeId)}</TableCell>
                <TableCell>{enrollment.benefitPlan.name}</TableCell>
                <TableCell>{enrollment.effectiveDate.slice(0, 10)}</TableCell>
                <TableCell>
                  <ContributionCell tenantId={tenantId} enrollmentId={enrollment.id} />
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
      )}
    </div>
  );
}
