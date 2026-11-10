import { Badge } from '@/components/ui/badge';
import type { PurchaseRequisitionStatus } from './types';

const STATUS_VARIANT: Record<
  PurchaseRequisitionStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CONVERTED: 'default',
  CANCELLED: 'outline',
};

export function RequisitionStatusBadge({ status }: { status: PurchaseRequisitionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
