import { Badge } from '@/components/ui/badge';
import type { OrganizationVerificationStatus } from './types';

const STATUS_VARIANT: Record<
  OrganizationVerificationStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  UNVERIFIED: 'outline',
  PENDING_REVIEW: 'warning',
  VERIFIED: 'success',
  REJECTED: 'destructive',
};

const STATUS_LABEL: Record<OrganizationVerificationStatus, string> = {
  UNVERIFIED: 'Unverified',
  PENDING_REVIEW: 'Pending review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export function OrganizationVerificationStatusBadge({ status }: { status: OrganizationVerificationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
