'use client';

import { useEmployee } from './queries';
import { useOrganization, useOrganizationUnits } from '@/features/organizations/queries';
import { EmploymentStatusBadge } from './employment-status-badge';
import { StatusChangeControl } from './status-change-control';
import { UpdateEmployeeForm } from './update-employee-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function EmployeeDetail({ tenantId, employeeId }: { tenantId: string; employeeId: string }) {
  const { data: employee, isLoading, isError, error } = useEmployee(tenantId, employeeId);
  // Employee only carries organizationId/organizationUnitId - resolve them to
  // display names here rather than showing raw UUIDs in the Details card.
  const { data: organization } = useOrganization(tenantId, employee?.organizationId ?? '');
  const { data: organizationUnits } = useOrganizationUnits(tenantId, employee?.organizationId ?? '');
  const organizationUnit = organizationUnits?.find((unit) => unit.id === employee?.organizationUnitId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !employee) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load employee')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeNumber} · ${employee.jobTitle}`}
        action={<EmploymentStatusBadge status={employee.employmentStatus} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Organization" value={organization?.legalName} />
          <Field label="Organization unit" value={organizationUnit?.name} />
          <Field label="Manager" value={employee.managerId} />
          <Field label="Employment type" value={employee.employmentType} />
          <Field label="Hire date" value={employee.hireDate?.slice(0, 10)} />
          <Field label="Country" value={employee.countryCode} />
          <Field label="Base salary" value={employee.baseSalary} />
          <Field label="Pay frequency" value={employee.payFrequency} />
          <Field label="Currency" value={employee.currency} />
          <Field label="Annual rent paid" value={employee.annualRentPaid} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Personal email" value={employee.personalEmail} />
          <Field label="Nationality" value={employee.nationality} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusChangeControl tenantId={tenantId} employee={employee} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateEmployeeForm tenantId={tenantId} employee={employee} />
        </CardContent>
      </Card>
    </div>
  );
}
