import { Badge } from '@/components/ui/badge';
import type { PerformanceReviewStatus } from './types';

const STATUS_VARIANT: Record<PerformanceReviewStatus, 'outline' | 'warning' | 'success' | 'destructive'> = {
  DRAFT: 'outline',
  SELF_SUBMITTED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export function ReviewStatusBadge({ status }: { status: PerformanceReviewStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
