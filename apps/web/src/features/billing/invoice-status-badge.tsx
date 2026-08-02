import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from './types';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANT: Record<InvoiceStatus, 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  PAID: 'success',
  CANCELLED: 'destructive',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
