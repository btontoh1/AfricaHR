'use client';

import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationTemplates, useUpdateNotificationTemplate } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function ToggleActiveButton({ tenantId, id, isActive }: { tenantId: string; id: string; isActive: boolean }) {
  const updateTemplate = useUpdateNotificationTemplate(tenantId, id);

  async function handleToggle() {
    try {
      await updateTemplate.mutateAsync({ isActive: !isActive });
      toast.success(isActive ? 'Template deactivated' : 'Template activated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update notification template'));
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={updateTemplate.isPending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}

export function NotificationTemplatesList({ tenantId }: { tenantId: string }) {
  const { data: templates, isLoading, isError, error } = useNotificationTemplates(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load notification templates')} />;
  }

  if (!templates || templates.length === 0) {
    return <EmptyState icon={FileText} title="No notification templates yet" description="Add the first template above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-mono text-xs">{template.code}</TableCell>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell className="text-muted-foreground">{template.channel}</TableCell>
              <TableCell>
                <Badge variant={template.isActive ? 'success' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <ToggleActiveButton tenantId={tenantId} id={template.id} isActive={template.isActive} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
