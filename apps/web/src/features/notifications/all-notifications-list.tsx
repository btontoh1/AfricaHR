'use client';

import { useState } from 'react';
import { useAllNotifications } from './queries';
import { useUsers } from '@/features/iam/queries';
import { NotificationStatusBadge } from './notification-status-badge';
import type { NotificationStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ALL_USERS = 'ALL';
const ALL_STATUSES = 'ALL';
const STATUS_FILTERS: (NotificationStatus | typeof ALL_STATUSES)[] = [
  ALL_STATUSES,
  'PENDING',
  'SENT',
  'FAILED',
];

export function AllNotificationsList({ tenantId }: { tenantId: string }) {
  const [userId, setUserId] = useState(ALL_USERS);
  const [status, setStatus] = useState<NotificationStatus | typeof ALL_STATUSES>(ALL_STATUSES);

  const { data: users } = useUsers();
  const { data: notifications, isLoading, isError, error } = useAllNotifications(tenantId, {
    userId: userId === ALL_USERS ? undefined : userId,
    status: status === ALL_STATUSES ? undefined : status,
  });

  const userName = (id: string) => {
    const user = users?.find((u) => u.id === id);
    return user ? `${user.firstName} ${user.lastName}` : id;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_USERS}>All users</SelectItem>
            {users?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load notifications')}
        </p>
      )}

      {notifications && notifications.length === 0 && (
        <p className="text-sm text-muted-foreground">No notifications match this filter.</p>
      )}

      {notifications && notifications.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Failure reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>{userName(notification.userId)}</TableCell>
                <TableCell>{notification.subject}</TableCell>
                <TableCell>{notification.channel}</TableCell>
                <TableCell>
                  <NotificationStatusBadge status={notification.status} />
                </TableCell>
                <TableCell>{notification.failureReason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
