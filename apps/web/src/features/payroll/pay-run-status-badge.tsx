import { Badge } from '@/components/ui/badge';
import type { PayRunStatus } from './types';

const STATUS_VARIANT: Record<PayRunStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  PROCESSING: 'secondary',
  APPROVED: 'secondary',
  PAID: 'default',
  CLOSED: 'default',
  CANCELLED: 'destructive',
};

export function PayRunStatusBadge({ status }: { status: PayRunStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
