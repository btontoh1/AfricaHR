'use client';

import { toast } from 'sonner';
import { useNotificationTemplates, useUpdateNotificationTemplate } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load notification templates')}
      </p>
    );
  }

  if (!templates || templates.length === 0) {
    return <p className="text-sm text-muted-foreground">No notification templates yet.</p>;
  }

  return (
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
            <TableCell>{template.code}</TableCell>
            <TableCell>{template.name}</TableCell>
            <TableCell>{template.channel}</TableCell>
            <TableCell>
              <Badge variant={template.isActive ? 'default' : 'secondary'}>
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
  );
}
