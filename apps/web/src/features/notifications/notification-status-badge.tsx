import { Badge } from '@/components/ui/badge';
import type { NotificationStatus } from './types';

const STATUS_VARIANT: Record<NotificationStatus, 'destructive' | 'outline' | 'success' | 'warning'> = {
  PENDING: 'warning',
  SENT: 'success',
  FAILED: 'destructive',
};

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
