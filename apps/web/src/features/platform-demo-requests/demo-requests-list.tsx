'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle, Presentation } from 'lucide-react';
import { useDemoRequests, useMarkAllDemoRequestsViewed } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DemoRequestsList() {
  const { data: demoRequests, isLoading, isError, error } = useDemoRequests();
  const markAllViewed = useMarkAllDemoRequestsViewed();
  // Read through a ref rather than depending on markAllViewed.mutate
  // directly — the effect below should fire once per mount (visiting this
  // page is what "seeing" the requests means), not on every render where
  // the mutation object's identity happens to change.
  const markAllViewedRef = useRef(markAllViewed.mutate);
  markAllViewedRef.current = markAllViewed.mutate;

  useEffect(() => {
    markAllViewedRef.current();
  }, []);

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
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {request.fullName}
                      {!request.viewedAt && <Badge>New</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {request.phoneNumber}
                      {request.isWhatsapp && (
                        <MessageCircle
                          className="size-3.5 text-primary"
                          aria-label="Prefers WhatsApp"
                        />
                      )}
                    </span>
                  </TableCell>
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
