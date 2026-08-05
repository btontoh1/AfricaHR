// Plain string-union (not a TS `enum`) so this stays structurally
// interchangeable with Prisma's generated TenantStatus type, which is
// itself a string union — the two must never need a cast at the boundary.
export const TenantStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

// CLOSED -> TRIAL ("reopening"/"reregistering" a cancelled tenant)
// deliberately lands on TRIAL, not ACTIVE - it restarts the tenant's
// lifecycle the same way a brand-new signup would, rather than assuming
// whatever subscription/agreement justified the reopening is still in
// force. Moving straight to ACTIVE (and re-enabling billing/full access)
// is a separate, explicit second step through the normal TRIAL -> ACTIVE
// transition below.
const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  [TenantStatus.TRIAL]: [TenantStatus.ACTIVE, TenantStatus.CLOSED],
  [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.CLOSED],
  [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.CLOSED],
  [TenantStatus.CLOSED]: [TenantStatus.TRIAL],
};

export function canTransitionTenantStatus(from: TenantStatus, to: TenantStatus): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTenantStatusTransition(from: TenantStatus, to: TenantStatus): void {
  if (!canTransitionTenantStatus(from, to)) {
    throw new Error(`Cannot transition tenant status from ${from} to ${to}`);
  }
}
