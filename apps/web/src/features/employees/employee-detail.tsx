'use client';

import { useEmployee } from './queries';
import { EmploymentStatusBadge } from './employment-status-badge';
import { StatusChangeControl } from './status-change-control';
import { UpdateEmployeeForm } from './update-employee-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load employee')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.employeeNumber} · {employee.jobTitle}
          </p>
        </div>
        <EmploymentStatusBadge status={employee.employmentStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Organization" value={employee.organizationId} />
          <Field label="Organization unit" value={employee.organizationUnitId} />
          <Field label="Manager" value={employee.managerId} />
          <Field label="Employment type" value={employee.employmentType} />
          <Field label="Hire date" value={employee.hireDate?.slice(0, 10)} />
          <Field label="Country" value={employee.countryCode} />
          <Field label="Base salary" value={employee.baseSalary} />
          <Field label="Pay frequency" value={employee.payFrequency} />
          <Field label="Currency" value={employee.currency} />
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
