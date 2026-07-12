import { Badge } from '@/components/ui/badge';
import type { PerformanceReviewStatus } from './types';

const STATUS_VARIANT: Record<PerformanceReviewStatus, 'outline' | 'warning' | 'success'> = {
  DRAFT: 'outline',
  SELF_SUBMITTED: 'warning',
  COMPLETED: 'success',
};

export function ReviewStatusBadge({ status }: { status: PerformanceReviewStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
