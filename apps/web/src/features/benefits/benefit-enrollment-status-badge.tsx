import { Badge } from '@/components/ui/badge';
import type { BenefitEnrollmentStatus } from './types';

const STATUS_VARIANT: Record<BenefitEnrollmentStatus, 'default' | 'secondary'> = {
  ACTIVE: 'default',
  CANCELLED: 'secondary',
};

export function BenefitEnrollmentStatusBadge({ status }: { status: BenefitEnrollmentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
