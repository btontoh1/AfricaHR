import { Badge } from '@/components/ui/badge';
import type { PayslipDisbursementStatus } from './types';

const STATUS_CONFIG: Record<
  PayslipDisbursementStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }
> = {
  NOT_INITIATED: { label: 'Not sent', variant: 'outline' },
  PENDING: { label: 'Sending…', variant: 'warning' },
  SUCCESS: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
};

export function DisbursementStatusBadge({ status }: { status: PayslipDisbursementStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
