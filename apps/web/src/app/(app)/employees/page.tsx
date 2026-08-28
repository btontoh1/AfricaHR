'use client';

import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { useSession } from '../session-provider';
import { useEmployees } from '@/features/employees/queries';
import { EmploymentStatusBadge } from '@/features/employees/employment-status-badge';
import { BulkImportEmployeesDialog } from '@/features/employees/bulk-import-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
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

export default function EmployeesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: employees, isLoading, isError, error } = useEmployees(tenantId);

  return (
    <div>
      <PageHeader
        title="Employees"
        description={employees ? `${employees.length} employee${employees.length === 1 ? '' : 's'}` : undefined}
        action={
          <div className="flex gap-2">
            <BulkImportEmployeesDialog tenantId={tenantId} />
            <Button asChild>
              <Link href="/employees/new">
                <UserPlus className="size-4" />
                Add employee
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load employees')} />}

      {employees && employees.length === 0 && (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Add your first employee to get started."
          action={
            <Button asChild size="sm">
              <Link href="/employees/new">
                <UserPlus className="size-4" />
                Add employee
              </Link>
            </Button>
          }
        />
      )}

      {employees && employees.length > 0 && (
        <TableCard>
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
                    <Link href={`/employees/${employee.id}`} className="font-medium hover:underline">
                      {employee.firstName} {employee.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.jobTitle}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.employmentType.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <EmploymentStatusBadge status={employee.employmentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
