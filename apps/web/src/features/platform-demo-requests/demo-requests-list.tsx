'use client';

import { Presentation } from 'lucide-react';
import { useDemoRequests } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DemoRequestsList() {
  const { data: demoRequests, isLoading, isError, error } = useDemoRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo requests"
        description={
          demoRequests
            ? `${demoRequests.length} request${demoRequests.length === 1 ? '' : 's'}`
            : undefined
        }
      />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load demo requests')} />}

      {demoRequests && demoRequests.length === 0 && (
        <EmptyState
          icon={Presentation}
          title="No demo requests yet"
          description='Submissions from the "Book a demo" form on the marketing site will appear here.'
        />
      )}

      {demoRequests && demoRequests.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Preferred date/time</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{request.email}</TableCell>
                  <TableCell className="text-muted-foreground">{request.phoneNumber ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{request.organizationName}</TableCell>
                  <TableCell className="text-muted-foreground">{request.numberOfEmployees ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.preferredDate ?? '—'} {request.preferredTime ?? ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.createdAt.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
