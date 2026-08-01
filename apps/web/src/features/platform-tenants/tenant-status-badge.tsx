import { Badge } from '@/components/ui/badge';
import { TENANT_STATUS_LABEL } from './tenant-status';
import type { TenantStatus } from './types';

const STATUS_VARIANT: Record<TenantStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  TRIAL: 'secondary',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CLOSED: 'destructive',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{TENANT_STATUS_LABEL[status]}</Badge>;
}
