import { Badge } from '@/components/ui/badge';
import type { PayRunStatus } from './types';

const STATUS_VARIANT: Record<
  PayRunStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'outline',
  PROCESSING: 'warning',
  APPROVED: 'default',
  PAID: 'success',
  CLOSED: 'secondary',
  CANCELLED: 'destructive',
};

export function PayRunStatusBadge({ status }: { status: PayRunStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
