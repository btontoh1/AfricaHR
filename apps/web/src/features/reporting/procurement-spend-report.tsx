'use client';

import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { useProcurementSpendReport } from './queries';
import { getDefaultDateRange } from './date-range';
import { StatCard } from './stat-card';
import { ReportViewTabs, type ReportView } from './report-view-tabs';
import { ReportBarChart } from './report-bar-chart';
import { CHART_COLORS } from './chart-colors';
import { useInventoryVendors } from '@/features/inventory/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_VENDORS = 'ALL';

export function ProcurementSpendReport({ tenantId }: { tenantId: string }) {
  const [vendorId, setVendorId] = useState(ALL_VENDORS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());
  const [view, setView] = useState<ReportView>('table');
  const { data: vendors } = useInventoryVendors(tenantId);

  const { data: report, isLoading, isError, error } = useProcurementSpendReport(tenantId, {
    vendorId: vendorId === ALL_VENDORS ? undefined : vendorId,
    from,
    to,
  });

  const grandTotal = report?.reduce((sum, row) => sum + row.totalSpend, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Label>Vendor</Label>
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VENDORS}>All vendors</SelectItem>
              {vendors?.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="procurement-spend-from">From</Label>
          <Input
            id="procurement-spend-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="procurement-spend-to">To</Label>
          <Input
            id="procurement-spend-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the procurement spend report')} />}

      {report && report.length === 0 && (
        <EmptyState icon={Receipt} title="No committed spend for this filter" />
      )}

      {report && report.length > 0 && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <StatCard label="Total spend" value={grandTotal.toFixed(2)} icon={Receipt} />
          </div>
          <ReportViewTabs
            view={view}
            onViewChange={setView}
            table={
              <TableCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((row) => (
                      <TableRow key={`${row.vendorId}:${row.month}`}>
                        <TableCell className="font-medium">{row.vendorName}</TableCell>
                        <TableCell className="text-muted-foreground">{row.month}</TableCell>
                        <TableCell className="text-muted-foreground">{row.orderCount}</TableCell>
                        <TableCell>{row.totalSpend.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            }
            chart={
              <ReportBarChart
                data={report.map((row) => ({ name: `${row.vendorName} (${row.month})`, value: row.totalSpend }))}
                categoryKey="name"
                series={[{ key: 'value', label: 'Spend', color: CHART_COLORS[0] }]}
                valueFormatter={(value) => value.toFixed(2)}
                layout="vertical"
              />
            }
          />
        </div>
      )}
    </div>
  );
}
