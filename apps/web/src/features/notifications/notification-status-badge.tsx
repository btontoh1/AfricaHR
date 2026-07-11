import { Badge } from '@/components/ui/badge';
import type { NotificationStatus } from './types';

const STATUS_VARIANT: Record<NotificationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  SENT: 'default',
  FAILED: 'destructive',
};

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
