'use client';

import { Building2 } from 'lucide-react';
import { useOrganization, useOrganizationUnits } from './queries';
import { CreateOrganizationUnitForm } from './create-organization-unit-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
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
    return <CardSkeleton />;
  }

  if (isError || !organization) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load organization')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.legalName}
        description={organization.tradingName ? `Trading as ${organization.tradingName}` : undefined}
      />

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
            <TableCard>
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
            </TableCard>
          )}
          {units && units.length === 0 && (
            <EmptyState icon={Building2} title="No units yet" description="Create the first organization unit below." />
          )}
          <CreateOrganizationUnitForm tenantId={tenantId} organizationId={organizationId} />
        </CardContent>
      </Card>
    </div>
  );
}
