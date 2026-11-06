import { Badge } from '@/components/ui/badge';
import type { VendorBillStatus } from './types';

const STATUS_VARIANT: Record<
  VendorBillStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
};

export function BillStatusBadge({ status }: { status: VendorBillStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
