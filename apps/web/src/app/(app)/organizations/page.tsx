'use client';

import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { useSession } from '../session-provider';
import { useOrganizations } from '@/features/organizations/queries';
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

export default function OrganizationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: organizations, isLoading, isError, error } = useOrganizations(tenantId);

  return (
    <div>
      <PageHeader
        title="Organizations"
        description={
          organizations
            ? `${organizations.length} organization${organizations.length === 1 ? '' : 's'}`
            : undefined
        }
        action={
          <Button asChild>
            <Link href="/organizations/new">
              <Plus className="size-4" />
              Add organization
            </Link>
          </Button>
        }
      />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load organizations')} />}

      {organizations && organizations.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Add your first organization to get started."
          action={
            <Button asChild size="sm">
              <Link href="/organizations/new">
                <Plus className="size-4" />
                Add organization
              </Link>
            </Button>
          }
        />
      )}

      {organizations && organizations.length > 0 && (
        <TableCard>
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
                    <Link href={`/organizations/${organization.id}`} className="font-medium hover:underline">
                      {organization.legalName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{organization.tradingName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{organization.countryCode}</TableCell>
                  <TableCell className="text-muted-foreground">{organization.registrationNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
