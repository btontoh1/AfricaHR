// Plain string-union (not a TS `enum`), same reasoning as
// @africahr/tenancy-domain's TenantStatus: stays structurally interchangeable
// with Prisma's generated EmploymentStatus type without casts at the boundary.
export const EmploymentStatus = {
  PENDING_ONBOARDING: 'PENDING_ONBOARDING',
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;

export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];

const ALLOWED_TRANSITIONS: Record<EmploymentStatus, EmploymentStatus[]> = {
  [EmploymentStatus.PENDING_ONBOARDING]: [EmploymentStatus.ACTIVE, EmploymentStatus.TERMINATED],
  [EmploymentStatus.ACTIVE]: [
    EmploymentStatus.ON_LEAVE,
    EmploymentStatus.SUSPENDED,
    EmploymentStatus.TERMINATED,
  ],
  [EmploymentStatus.ON_LEAVE]: [EmploymentStatus.ACTIVE, EmploymentStatus.TERMINATED],
  [EmploymentStatus.SUSPENDED]: [EmploymentStatus.ACTIVE, EmploymentStatus.TERMINATED],
  [EmploymentStatus.TERMINATED]: [],
};

export function canTransitionEmploymentStatus(
  from: EmploymentStatus,
  to: EmploymentStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
