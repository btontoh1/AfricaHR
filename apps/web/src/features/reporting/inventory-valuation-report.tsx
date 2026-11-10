'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { useInventoryValuationReport } from './queries';
import { StatCard } from './stat-card';
import { ReportViewTabs, type ReportView } from './report-view-tabs';
import { ReportBarChart } from './report-bar-chart';
import { CHART_COLORS } from './chart-colors';
import { useInventoryWarehouses } from '@/features/inventory/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_WAREHOUSES = 'ALL';

export function InventoryValuationReport({ tenantId }: { tenantId: string }) {
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const [view, setView] = useState<ReportView>('table');
  const scopedWarehouseId = warehouseId === ALL_WAREHOUSES ? undefined : warehouseId;

  const { data: report, isLoading, isError, error } = useInventoryValuationReport(tenantId, {
    warehouseId: scopedWarehouseId,
  });
  const { data: warehouses } = useInventoryWarehouses(tenantId);

  return (
    <div className="space-y-4">
      <Select value={warehouseId} onValueChange={setWarehouseId}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_WAREHOUSES}>All warehouses</SelectItem>
          {warehouses?.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the inventory valuation report')} />}

      {report && report.rows.length === 0 && (
        <EmptyState icon={Coins} title="No stock on hand" description="Receive goods to see their value here." />
      )}

      {report && report.rows.length > 0 && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <StatCard label="Total inventory value" value={report.grandTotal.toFixed(2)} icon={Coins} />
          </div>
          <ReportViewTabs
            view={view}
            onViewChange={setView}
            table={
              <TableCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit cost</TableHead>
                      <TableHead>Total value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row) => (
                      <TableRow key={`${row.warehouseId}:${row.productId}`}>
                        <TableCell className="font-medium">{row.warehouseName}</TableCell>
                        <TableCell>
                          {row.productSku} — {row.productName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{row.unitCost.toFixed(2)}</TableCell>
                        <TableCell>{row.totalValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            }
            chart={
              <ReportBarChart
                data={report.rows.map((row) => ({ name: `${row.productSku}`, value: row.totalValue }))}
                categoryKey="name"
                series={[{ key: 'value', label: 'Total value', color: CHART_COLORS[0] }]}
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
