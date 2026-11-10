'use client';

import { useState } from 'react';
import { Laptop } from 'lucide-react';
import { useAssetRegisterReport } from './queries';
import { StatCard } from './stat-card';
import { CompanyAssetStatusBadge } from '@/features/inventory/company-asset-status-badge';
import type { CompanyAssetStatus } from '@/features/inventory/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_STATUSES = 'ALL';
const STATUSES: CompanyAssetStatus[] = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'];

export function AssetRegisterReport({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState(ALL_STATUSES);

  const { data: report, isLoading, isError, error } = useAssetRegisterReport(tenantId, {
    status: status === ALL_STATUSES ? undefined : (status as CompanyAssetStatus),
  });

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
          {STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the asset register report')} />}

      {report && report.assets.length === 0 && <EmptyState icon={Laptop} title="No company assets yet" />}

      {report && report.assets.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total assets" value={report.assets.length} icon={Laptop} />
            <StatCard label="Total purchase price" value={report.totalPurchasePrice.toFixed(2)} />
            {report.countsByStatus.map((count) => (
              <StatCard key={count.status} label={count.status} value={count.count} />
            ))}
          </div>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase price</TableHead>
                  <TableHead>Assigned to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetTag}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.category ?? '—'}</TableCell>
                    <TableCell>
                      <CompanyAssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.purchasePrice != null ? asset.purchasePrice.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.assignedEmployeeName ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      )}
    </div>
  );
}
