import type { TenantStatus } from './types';

// Mirrors canTransitionTenantStatus in libs/tenancy/domain/src/lib/tenant-status.ts -
// that lib is backend-only (not bundled for apps/web), and the backend still
// enforces this for real, so this only needs to be good enough to avoid
// offering a transition button that would just 409.
const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  TRIAL: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['SUSPENDED', 'CLOSED'],
  SUSPENDED: ['ACTIVE', 'CLOSED'],
  CLOSED: ['TRIAL'],
};

export function allowedNextStatuses(status: TenantStatus): TenantStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CLOSED: 'Closed',
};
