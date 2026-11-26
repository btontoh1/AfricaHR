'use client';

import { FileText } from 'lucide-react';
import { useMyWeeklyReports } from './weekly-report-queries';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getApiErrorMessage } from '@/lib/api-error';

export function MyWeeklyReportsHistory({ tenantId }: { tenantId: string }) {
  const { data: reports, isLoading, isError, error } = useMyWeeklyReports(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your reports')} />;
  }

  if (!reports || reports.length === 0) {
    return <EmptyState icon={FileText} title="No reports yet" description="Your weekly reports will show up here once submitted." />;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="font-medium">Week of {new Date(report.weekStart).toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">
              Submitted {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'not yet'}
            </p>
          </div>
          {report.isLate && <Badge variant="destructive">Late</Badge>}
        </div>
      ))}
    </div>
  );
}
