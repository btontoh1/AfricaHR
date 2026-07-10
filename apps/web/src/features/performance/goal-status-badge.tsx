import { Badge } from '@/components/ui/badge';
import type { PerformanceGoalStatus } from './types';

const STATUS_VARIANT: Record<PerformanceGoalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

export function GoalStatusBadge({ status }: { status: PerformanceGoalStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
