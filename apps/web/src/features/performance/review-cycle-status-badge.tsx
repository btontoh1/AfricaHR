import { Badge } from '@/components/ui/badge';
import type { ReviewCycleStatus } from './types';

const STATUS_VARIANT: Record<ReviewCycleStatus, 'default' | 'secondary' | 'outline'> = {
  UPCOMING: 'outline',
  ACTIVE: 'default',
  CLOSED: 'secondary',
};

export function ReviewCycleStatusBadge({ status }: { status: ReviewCycleStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
