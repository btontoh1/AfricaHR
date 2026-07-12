import { Badge } from '@/components/ui/badge';
import type { LeaveRequestStatus } from './types';

const STATUS_VARIANT: Record<
  LeaveRequestStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
};

export function LeaveRequestStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
