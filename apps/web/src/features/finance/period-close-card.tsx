'use client';

import { usePeriodCloses } from './queries';
import { SetPeriodCloseDialog } from './set-period-close-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PeriodCloseCard({ tenantId }: { tenantId: string }) {
  const { data: organizations } = useOrganizations(tenantId);
  const organizationIds = organizations?.map((organization) => organization.id) ?? [];
  const { data: periodCloses } = usePeriodCloses(tenantId, organizationIds);

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Period close</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Closed through</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((organization, index) => {
              const close = periodCloses?.[index];
              return (
                <TableRow key={organization.id}>
                  <TableCell className="font-medium">{organization.legalName}</TableCell>
                  <TableCell>
                    {close?.closedThrough ? (
                      <span>{close.closedThrough.slice(0, 10)}</span>
                    ) : (
                      <Badge variant="outline">Not closed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SetPeriodCloseDialog
                      tenantId={tenantId}
                      organizationId={organization.id}
                      organizationName={organization.legalName}
                      currentClosedThrough={close?.closedThrough}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
