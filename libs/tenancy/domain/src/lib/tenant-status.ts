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

const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  [TenantStatus.TRIAL]: [TenantStatus.ACTIVE, TenantStatus.CLOSED],
  [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.CLOSED],
  [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.CLOSED],
  [TenantStatus.CLOSED]: [],
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
