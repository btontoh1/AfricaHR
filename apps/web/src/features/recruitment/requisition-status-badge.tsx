import { Badge } from '@/components/ui/badge';
import type { JobRequisitionStatus } from './types';

const STATUS_VARIANT: Record<JobRequisitionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  OPEN: 'default',
  ON_HOLD: 'secondary',
  CLOSED: 'secondary',
  CANCELLED: 'destructive',
};

export function RequisitionStatusBadge({ status }: { status: JobRequisitionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
