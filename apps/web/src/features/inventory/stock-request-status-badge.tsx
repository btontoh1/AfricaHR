import { Badge } from '@/components/ui/badge';
import type { StockRequestStatus } from './types';

const STATUS_VARIANT: Record<
  StockRequestStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  PENDING: 'warning',
  APPROVED: 'default',
  FULFILLED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
};

export function StockRequestStatusBadge({ status }: { status: StockRequestStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
