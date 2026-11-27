'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { useSession } from '../session-provider';
import { useEmployees } from '@/features/employees/queries';
import { useOrganizations } from '@/features/organizations/queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
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
  const { data: organizations } = useOrganizations(tenantId);
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);

  const organizationName = useMemo(() => {
    const byId = new Map(organizations?.map((organization) => [organization.id, organization.legalName]));
    return (id: string) => byId.get(id) ?? '—';
  }, [organizations]);

  const visibleEmployees = useMemo(() => {
    if (!employees) return employees;
    if (organizationId === ALL_ORGANIZATIONS) return employees;
    return employees.filter((employee) => employee.organizationId === organizationId);
  }, [employees, organizationId]);

  return (
    <div>
      <PageHeader
        title="Employees"
        description={
          visibleEmployees
            ? `${visibleEmployees.length} employee${visibleEmployees.length === 1 ? '' : 's'}`
            : undefined
        }
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
        <>
          {organizations && organizations.length > 1 && (
            <div className="mb-4">
              <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
            </div>
          )}

          {visibleEmployees && visibleEmployees.length === 0 && (
            <EmptyState
              icon={Users}
              title="No employees in this organization"
              description="Try a different organization, or add an employee to this one."
            />
          )}

          {visibleEmployees && visibleEmployees.length > 0 && (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Job title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleEmployees.map((employee) => (
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
                      <TableCell className="text-muted-foreground">
                        {organizationName(employee.organizationId)}
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
        </>
      )}
    </div>
  );
}
