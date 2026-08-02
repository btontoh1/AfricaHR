import { Badge } from '@/components/ui/badge';
import type { SubscriptionStatus } from './types';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Trialing',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELLED: 'Cancelled',
};

const STATUS_VARIANT: Record<SubscriptionStatus, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  TRIALING: 'secondary',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELLED: 'destructive',
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
