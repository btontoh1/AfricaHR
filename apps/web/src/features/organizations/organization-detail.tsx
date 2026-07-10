'use client';

import { useOrganization, useOrganizationUnits } from './queries';
import { CreateOrganizationUnitForm } from './create-organization-unit-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function OrganizationDetail({
  tenantId,
  organizationId,
}: {
  tenantId: string;
  organizationId: string;
}) {
  const { data: organization, isLoading, isError, error } = useOrganization(tenantId, organizationId);
  const { data: units } = useOrganizationUnits(tenantId, organizationId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load organization')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{organization.legalName}</h1>
        {organization.tradingName && (
          <p className="text-sm text-muted-foreground">Trading as {organization.tradingName}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" value={organization.countryCode} />
          <Field label="Registration number" value={organization.registrationNumber} />
          <Field label="Tax identification number" value={organization.taxIdentificationNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {units && units.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Parent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>{unit.name}</TableCell>
                    <TableCell>{unit.code}</TableCell>
                    <TableCell className="font-mono text-xs">{unit.id}</TableCell>
                    <TableCell className="font-mono text-xs">{unit.parentId ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {units && units.length === 0 && (
            <p className="text-sm text-muted-foreground">No units yet.</p>
          )}
          <CreateOrganizationUnitForm tenantId={tenantId} organizationId={organizationId} />
        </CardContent>
      </Card>
    </div>
  );
}
