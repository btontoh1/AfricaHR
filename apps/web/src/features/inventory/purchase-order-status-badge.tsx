import { Badge } from '@/components/ui/badge';
import type { PurchaseOrderStatus } from './types';

const STATUS_VARIANT: Record<
  PurchaseOrderStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  SENT: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'outline',
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
