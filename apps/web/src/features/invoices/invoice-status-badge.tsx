import { Badge } from '@/components/ui/badge';
import type { CustomerInvoiceStatus } from './types';

const STATUS_VARIANT: Record<
  CustomerInvoiceStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  SENT: 'default',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
};

export function InvoiceStatusBadge({ status }: { status: CustomerInvoiceStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
