'use client';

import { toast } from 'sonner';
import { Laptop } from 'lucide-react';
import {
  useCompanyAssets,
  useDeleteCompanyAsset,
  useMakeAssetAvailable,
  useRetireAsset,
  useSetAssetMaintenance,
} from './queries';
import { CompanyAssetStatusBadge } from './company-asset-status-badge';
import { AssignAssetDialog } from './assign-asset-dialog';
import { ReturnAssetDialog } from './return-asset-dialog';
import { UpdateCompanyAssetDialog } from './update-company-asset-dialog';
import { AssetAssignmentHistoryDialog } from './asset-assignment-history-dialog';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CompanyAssetsList({ tenantId }: { tenantId: string }) {
  const { data: assets, isLoading, isError, error } = useCompanyAssets(tenantId);
  const retireAsset = useRetireAsset(tenantId);
  const setMaintenance = useSetAssetMaintenance(tenantId);
  const makeAvailable = useMakeAssetAvailable(tenantId);
  const deleteAsset = useDeleteCompanyAsset(tenantId);

  async function handleRetire(id: string) {
    try {
      await retireAsset.mutateAsync(id);
      toast.success('Asset retired');
    } catch (retireError) {
      toast.error(getApiErrorMessage(retireError, 'Failed to retire asset'));
    }
  }

  async function handleSetMaintenance(id: string) {
    try {
      await setMaintenance.mutateAsync(id);
      toast.success('Asset sent to maintenance');
    } catch (maintenanceError) {
      toast.error(getApiErrorMessage(maintenanceError, 'Failed to update asset'));
    }
  }

  async function handleMakeAvailable(id: string) {
    try {
      await makeAvailable.mutateAsync(id);
      toast.success('Asset marked available');
    } catch (availableError) {
      toast.error(getApiErrorMessage(availableError, 'Failed to update asset'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load assets')} />;
  }

  if (!assets || assets.length === 0) {
    return <EmptyState icon={Laptop} title="No company assets yet" description="Add your first asset above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-mono text-muted-foreground">{asset.assetTag}</TableCell>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell className="text-muted-foreground">{asset.category ?? '—'}</TableCell>
              <TableCell>
                <CompanyAssetStatusBadge status={asset.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <AssetAssignmentHistoryDialog tenantId={tenantId} assetId={asset.id} label={asset.assetTag} />
                  {asset.status === 'AVAILABLE' && (
                    <>
                      <AssignAssetDialog tenantId={tenantId} id={asset.id} />
                      <Button size="sm" variant="outline" onClick={() => handleSetMaintenance(asset.id)} disabled={setMaintenance.isPending}>
                        Maintenance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRetire(asset.id)} disabled={retireAsset.isPending}>
                        Retire
                      </Button>
                    </>
                  )}
                  {asset.status === 'ASSIGNED' && <ReturnAssetDialog tenantId={tenantId} id={asset.id} />}
                  {asset.status === 'MAINTENANCE' && (
                    <Button size="sm" onClick={() => handleMakeAvailable(asset.id)} disabled={makeAvailable.isPending}>
                      Make available
                    </Button>
                  )}
                  <UpdateCompanyAssetDialog tenantId={tenantId} asset={asset} />
                  {asset.status !== 'ASSIGNED' && (
                    <DeleteEntityDialog
                      label={asset.name}
                      onDelete={() => deleteAsset.mutateAsync(asset.id)}
                      errorMessage="Failed to delete asset"
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
