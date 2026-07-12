import { Badge } from '@/components/ui/badge';
import type { EmploymentStatus } from './types';

const STATUS_VARIANT: Record<
  EmploymentStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  PENDING_ONBOARDING: 'outline',
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  SUSPENDED: 'warning',
  TERMINATED: 'destructive',
};

const STATUS_LABEL: Record<EmploymentStatus, string> = {
  PENDING_ONBOARDING: 'Pending onboarding',
  ACTIVE: 'Active',
  ON_LEAVE: 'On leave',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
};

export function EmploymentStatusBadge({ status }: { status: EmploymentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
