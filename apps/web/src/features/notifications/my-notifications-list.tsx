'use client';

import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteNotification, useMarkNotificationRead, useMyNotifications } from './queries';
import { NotificationStatusBadge } from './notification-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function MyNotificationsList({ tenantId }: { tenantId: string }) {
  const { data: notifications, isLoading, isError, error } = useMyNotifications(tenantId);
  const markRead = useMarkNotificationRead(tenantId);
  const deleteNotification = useDeleteNotification(tenantId);

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
      toast.success('Marked as read');
    } catch (markError) {
      toast.error(getApiErrorMessage(markError, 'Failed to mark notification as read'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success('Notification deleted');
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Failed to delete notification'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your notifications')} />;
  }

  if (!notifications || notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications yet" />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Read</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>
                <div className="font-medium">{notification.subject}</div>
                <div className="text-xs text-muted-foreground">{notification.body}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">{notification.channel}</TableCell>
              <TableCell>
                <NotificationStatusBadge status={notification.status} />
              </TableCell>
              <TableCell>{notification.isRead ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {notification.status === 'SENT' && !notification.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={markRead.isPending}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    disabled={deleteNotification.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
