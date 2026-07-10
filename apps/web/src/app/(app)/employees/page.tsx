'use client';

import Link from 'next/link';
import { useSession } from '../session-provider';
import { useEmployees } from '@/features/employees/queries';
import { EmploymentStatusBadge } from '@/features/employees/employment-status-badge';
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

export default function EmployeesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: employees, isLoading, isError, error } = useEmployees(tenantId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {employees ? `${employees.length} employee${employees.length === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
        <Button asChild>
          <Link href="/employees/new">Add employee</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Failed to load employees')}</p>
      )}

      {employees && employees.length === 0 && (
        <p className="text-sm text-muted-foreground">No employees yet.</p>
      )}

      {employees && employees.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/employees/${employee.id}`} className="hover:underline">
                    {employee.employeeNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/employees/${employee.id}`} className="hover:underline">
                    {employee.firstName} {employee.lastName}
                  </Link>
                </TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{employee.employmentType}</TableCell>
                <TableCell>
                  <EmploymentStatusBadge status={employee.employmentStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
