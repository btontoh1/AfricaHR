import { Badge } from '@/components/ui/badge';
import type { PerformanceReviewStatus } from './types';

const STATUS_VARIANT: Record<PerformanceReviewStatus, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  SELF_SUBMITTED: 'default',
  COMPLETED: 'secondary',
};

export function ReviewStatusBadge({ status }: { status: PerformanceReviewStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
