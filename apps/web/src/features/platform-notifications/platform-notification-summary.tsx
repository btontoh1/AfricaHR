'use client';

import Link from 'next/link';
import { MailCheck, MailX, Clock } from 'lucide-react';
import { useNotificationDeliverySummary } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { StatCard } from '@/features/reporting/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PlatformNotificationSummary() {
  const { data: summary, isLoading, isError, error } = useNotificationDeliverySummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load notification delivery status')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Emails sent" value={summary.counts.sent} icon={MailCheck} />
        <StatCard label="Emails failed" value={summary.counts.failed} icon={MailX} />
        <StatCard label="Emails pending" value={summary.counts.pending} icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent email delivery failures</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.failed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent email delivery failures.</p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.failed.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Link
                          href={`/platform-admin/tenants/${entry.tenantId}`}
                          className="font-medium hover:underline"
                        >
                          {entry.tenantName ?? entry.tenantId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.userFirstName} {entry.userLastName} ({entry.userEmail})
                      </TableCell>
                      <TableCell>{entry.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.failureReason ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
