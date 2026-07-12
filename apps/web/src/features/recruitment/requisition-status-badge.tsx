import { Badge } from '@/components/ui/badge';
import type { JobRequisitionStatus } from './types';

const STATUS_VARIANT: Record<
  JobRequisitionStatus,
  'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'outline',
  OPEN: 'success',
  ON_HOLD: 'warning',
  CLOSED: 'secondary',
  CANCELLED: 'destructive',
};

export function RequisitionStatusBadge({ status }: { status: JobRequisitionStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status.replace('_', ' ')}</Badge>;
}
