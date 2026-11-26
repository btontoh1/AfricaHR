'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useSession } from '@/app/(app)/session-provider';
import { useWeeklyReports } from './weekly-report-queries';
import { WeeklyReportDetailDialog } from './weekly-report-detail-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';
import type { WeeklyReport } from './weekly-report-types';

export function WeeklyReportsReviewList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isUnitAdmin = session.role === 'UNIT_ADMIN';

  const [organizationId, setOrganizationId] = useState('');
  const [organizationUnitId, setOrganizationUnitId] = useState('');
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  const { data: reports, isLoading, isError, error } = useWeeklyReports(
    tenantId,
    isUnitAdmin ? undefined : organizationUnitId || undefined,
  );

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load weekly reports')} />;
  }

  return (
    <div className="space-y-4">
      {!isUnitAdmin && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56 space-y-1.5">
            <p className="text-sm font-medium">Company</p>
            <OrganizationPicker
              tenantId={tenantId}
              value={organizationId}
              onChange={(value) => {
                setOrganizationId(value);
                setOrganizationUnitId('');
              }}
            />
          </div>
          <div className="w-56 space-y-1.5">
            <p className="text-sm font-medium">Department</p>
            <OrganizationUnitPicker
              tenantId={tenantId}
              organizationId={organizationId}
              value={organizationUnitId}
              onChange={setOrganizationUnitId}
            />
          </div>
        </div>
      )}

      {!reports || reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description="Submitted weekly reports will show up here." />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.weekStart).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {report.isLate ? <Badge variant="destructive">Late</Badge> : <Badge variant="secondary">Submitted</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <WeeklyReportDetailDialog
        tenantId={tenantId}
        report={selectedReport}
        open={Boolean(selectedReport)}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </div>
  );
}
