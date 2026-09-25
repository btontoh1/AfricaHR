'use client';

import { useHomeCurrencies } from './queries';
import { SetHomeCurrencyDialog } from './set-home-currency-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function HomeCurrencyCard({ tenantId }: { tenantId: string }) {
  const { data: organizations } = useOrganizations(tenantId);
  const organizationIds = organizations?.map((organization) => organization.id) ?? [];
  const { data: homeCurrencies } = useHomeCurrencies(tenantId, organizationIds);

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home currency</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Home currency</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((organization, index) => {
              const homeCurrency = homeCurrencies?.[index];
              return (
                <TableRow key={organization.id}>
                  <TableCell className="font-medium">{organization.legalName}</TableCell>
                  <TableCell>
                    {homeCurrency?.currency ? (
                      <span>{homeCurrency.currency}</span>
                    ) : (
                      <Badge variant="outline">Not set</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SetHomeCurrencyDialog
                      tenantId={tenantId}
                      organizationId={organization.id}
                      organizationName={organization.legalName}
                      currentCurrency={homeCurrency?.currency}
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
