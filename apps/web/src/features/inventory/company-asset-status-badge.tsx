import { Badge } from '@/components/ui/badge';
import type { CompanyAssetStatus } from './types';

const STATUS_VARIANT: Record<
  CompanyAssetStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  AVAILABLE: 'success',
  ASSIGNED: 'default',
  MAINTENANCE: 'warning',
  RETIRED: 'outline',
};

export function CompanyAssetStatusBadge({ status }: { status: CompanyAssetStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
