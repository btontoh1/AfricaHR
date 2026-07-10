import { Badge } from '@/components/ui/badge';
import type { LeaveRequestStatus } from './types';

const STATUS_VARIANT: Record<LeaveRequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
};

export function LeaveRequestStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
