import { Badge } from '@/components/ui/badge';
import type { WalletTopUpStatus } from './types';

const STATUS_LABEL: Record<WalletTopUpStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANT: Record<WalletTopUpStatus, 'secondary' | 'success' | 'destructive'> = {
  PENDING: 'secondary',
  PAID: 'success',
  CANCELLED: 'destructive',
};

export function WalletTopUpStatusBadge({ status }: { status: WalletTopUpStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
