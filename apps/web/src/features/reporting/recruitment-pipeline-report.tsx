'use client';

import { useState } from 'react';
import { useRecruitmentPipelineReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { StatCard } from './stat-card';
import { ReportViewTabs, type ReportView } from './report-view-tabs';
import { ReportBarChart } from './report-bar-chart';
import { CHART_COLORS } from './chart-colors';
import { getApiErrorMessage } from '@/lib/api-error';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { TableCard } from '@/components/table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function RecruitmentPipelineReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [view, setView] = useState<ReportView>('table');

  const { data: report, isLoading, isError, error } = useRecruitmentPipelineReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
  });

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the recruitment pipeline report')} />}

      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Open requisitions" value={report.openRequisitions} />
            <StatCard label="Average time to hire (days)" value={report.averageTimeToHireDays} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Applications by stage</h2>
            <ReportViewTabs
              view={view}
              onViewChange={setView}
              table={
                <TableCard>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stage</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.applicationsByStage.map((row) => (
                        <TableRow key={row.stage}>
                          <TableCell>{row.stage}</TableCell>
                          <TableCell>{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableCard>
              }
              chart={
                <ReportBarChart
                  data={report.applicationsByStage.map((row) => ({ name: row.stage, count: row.count }))}
                  categoryKey="name"
                  series={[{ key: 'count', label: 'Applications', color: CHART_COLORS[0] }]}
                  layout="vertical"
                  height={Math.max(240, report.applicationsByStage.length * 56)}
                />
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
