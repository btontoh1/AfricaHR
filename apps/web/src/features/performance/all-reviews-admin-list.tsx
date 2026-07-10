'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAllReviews, useReviewCycles } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { ReviewStatusBadge } from './review-status-badge';
import type { PerformanceReviewStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
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
const STATUS_FILTERS: (PerformanceReviewStatus | typeof ALL)[] = [
  ALL,
  'DRAFT',
  'SELF_SUBMITTED',
  'COMPLETED',
];

export function AllReviewsAdminList({ tenantId }: { tenantId: string }) {
  const [employeeId, setEmployeeId] = useState(ALL);
  const [cycleId, setCycleId] = useState(ALL);
  const [status, setStatus] = useState<PerformanceReviewStatus | typeof ALL>(ALL);

  const { data: employees } = useEmployees(tenantId);
  const { data: cycles } = useReviewCycles(tenantId);
  const { data: reviews, isLoading, isError, error } = useAllReviews(tenantId, {
    employeeId: employeeId === ALL ? undefined : employeeId,
    cycleId: cycleId === ALL ? undefined : cycleId,
    status: status === ALL ? undefined : status,
  });

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };
  const cycleName = (id: string) => cycles?.find((cycle) => cycle.id === id)?.name ?? id;

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
        <Select value={cycleId} onValueChange={setCycleId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cycles</SelectItem>
            {cycles?.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name}
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
          {getApiErrorMessage(error, 'Failed to load reviews')}
        </p>
      )}

      {reviews && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">No reviews match this filter.</p>
      )}

      {reviews && reviews.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Self rating</TableHead>
              <TableHead>Manager rating</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{employeeName(review.employeeId)}</TableCell>
                <TableCell>{cycleName(review.cycleId)}</TableCell>
                <TableCell>
                  <ReviewStatusBadge status={review.status} />
                </TableCell>
                <TableCell>{review.selfRating ?? '—'}</TableCell>
                <TableCell>{review.managerRating ?? '—'}</TableCell>
                <TableCell>
                  <Link href={`/performance/reviews/all/${review.id}`} className="text-sm underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
