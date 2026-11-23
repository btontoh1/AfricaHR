'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useOrganizations } from '@/features/organizations/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Lets a platform admin reach a tenant's organizations directly, under
 * their own identity - e.g. to upload an invoice logo or fix an address on
 * a customer's behalf. Deliberately not impersonation: PLATFORM_ADMIN
 * already holds ORGANIZATION_MANAGE/INVOICING_MANAGE tenant-wide (see
 * assertTenantScope), so this is just the missing navigation path, not a
 * new capability - every change made here is attributed to the admin, not
 * the tenant's own users, the same as everything else on this page.
 */
export function OrganizationsCard({ tenantId }: { tenantId: string }) {
  const { data: organizations, isLoading, isError, error } = useOrganizations(tenantId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>
          Manage this tenant&apos;s legal entities directly - addresses, invoice logos, and verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <CardSkeleton />}

        {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load organizations')} />}

        {organizations && organizations.length === 0 && (
          <EmptyState icon={Building2} title="No organizations yet" description="This tenant has no organizations." />
        )}

        {organizations && organizations.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Legal name</TableHead>
                <TableHead>Trading name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    <Link
                      href={`/platform-admin/tenants/${tenantId}/organizations/${organization.id}`}
                      className="font-medium hover:underline"
                    >
                      {organization.legalName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{organization.tradingName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{organization.countryCode}</TableCell>
                  <TableCell className="text-muted-foreground">{organization.address ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
