import { Badge } from '@/components/ui/badge';
import type { PayslipStatus } from './types';

const STATUS_VARIANT: Record<PayslipStatus, 'outline' | 'default' | 'success'> = {
  DRAFT: 'outline',
  APPROVED: 'default',
  PAID: 'success',
};

export function PayslipStatusBadge({ status }: { status: PayslipStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
