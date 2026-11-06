import { Badge } from '@/components/ui/badge';
import type { BankReconciliation } from './types';

const STATUS_VARIANT: Record<BankReconciliation['status'], 'success' | 'secondary'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'secondary',
};

const STATUS_LABEL: Record<BankReconciliation['status'], string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
};

export function BankReconciliationStatusBadge({ status }: { status: BankReconciliation['status'] }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
