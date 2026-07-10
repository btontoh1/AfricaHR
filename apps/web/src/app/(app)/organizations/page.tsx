'use client';

import Link from 'next/link';
import { useSession } from '../session-provider';
import { useOrganizations } from '@/features/organizations/queries';
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

export default function OrganizationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: organizations, isLoading, isError, error } = useOrganizations(tenantId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            {organizations
              ? `${organizations.length} organization${organizations.length === 1 ? '' : 's'}`
              : ' '}
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">Add organization</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load organizations')}
        </p>
      )}

      {organizations && organizations.length === 0 && (
        <p className="text-sm text-muted-foreground">No organizations yet.</p>
      )}

      {organizations && organizations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Legal name</TableHead>
              <TableHead>Trading name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Registration #</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((organization) => (
              <TableRow key={organization.id}>
                <TableCell>
                  <Link href={`/organizations/${organization.id}`} className="hover:underline">
                    {organization.legalName}
                  </Link>
                </TableCell>
                <TableCell>{organization.tradingName ?? '—'}</TableCell>
                <TableCell>{organization.countryCode}</TableCell>
                <TableCell>{organization.registrationNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
