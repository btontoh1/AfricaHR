'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { useFixedAssets } from './queries';
import { DisposeFixedAssetDialog } from './dispose-fixed-asset-dialog';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function statusBadge(status: string) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>;
  if (status === 'FULLY_DEPRECIATED') return <Badge variant="secondary">Fully depreciated</Badge>;
  return <Badge variant="outline">Disposed</Badge>;
}

export function FixedAssetsList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: assets, isLoading, isError, error } = useFixedAssets(tenantId, scopedOrganizationId);

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load fixed assets')} />}

      {assets && assets.length === 0 && (
        <EmptyState
          icon={Package}
          title="No fixed assets yet"
          description="Add one above to start tracking its straight-line depreciation."
        />
      )}

      {assets && assets.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Acquired</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Accumulated depreciation</TableHead>
                <TableHead className="text-right">Net book value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.description}</TableCell>
                  <TableCell className="text-muted-foreground">{asset.acquisitionDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(asset.cost, asset.currency)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(asset.accumulatedDepreciation, asset.currency)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(asset.netBookValue, asset.currency)}</TableCell>
                  <TableCell>{statusBadge(asset.status)}</TableCell>
                  <TableCell className="text-right">
                    {asset.status !== 'DISPOSED' && (
                      <DisposeFixedAssetDialog tenantId={tenantId} assetId={asset.id} description={asset.description} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
