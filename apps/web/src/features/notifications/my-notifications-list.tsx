'use client';

import { toast } from 'sonner';
import { useMarkNotificationRead, useMyNotifications } from './queries';
import { NotificationStatusBadge } from './notification-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function MyNotificationsList({ tenantId }: { tenantId: string }) {
  const { data: notifications, isLoading, isError, error } = useMyNotifications(tenantId);
  const markRead = useMarkNotificationRead(tenantId);

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
      toast.success('Marked as read');
    } catch (markError) {
      toast.error(getApiErrorMessage(markError, 'Failed to mark notification as read'));
    }
  }

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
        {getApiErrorMessage(error, 'Failed to load your notifications')}
      </p>
    );
  }

  if (!notifications || notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No notifications yet.</p>;
  }

  return (
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
            <TableCell>{notification.channel}</TableCell>
            <TableCell>
              <NotificationStatusBadge status={notification.status} />
            </TableCell>
            <TableCell>{notification.isRead ? 'Yes' : 'No'}</TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
