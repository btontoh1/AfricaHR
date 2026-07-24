// Plain string-union (not a TS `enum`), same reasoning as TenantStatus:
// stays structurally interchangeable with Prisma's generated
// OrganizationVerificationStatus type without casts at the boundary.
export const OrganizationVerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type OrganizationVerificationStatus =
  (typeof OrganizationVerificationStatus)[keyof typeof OrganizationVerificationStatus];

// UNVERIFIED -> PENDING_REVIEW on submission; PENDING_REVIEW -> VERIFIED or
// REJECTED on review; REJECTED -> PENDING_REVIEW on resubmission after
// fixing the documents/fields a reviewer flagged. VERIFIED is terminal -
// there is no re-review flow once verified.
const ALLOWED_TRANSITIONS: Record<OrganizationVerificationStatus, OrganizationVerificationStatus[]> = {
  [OrganizationVerificationStatus.UNVERIFIED]: [OrganizationVerificationStatus.PENDING_REVIEW],
  [OrganizationVerificationStatus.PENDING_REVIEW]: [
    OrganizationVerificationStatus.VERIFIED,
    OrganizationVerificationStatus.REJECTED,
  ],
  [OrganizationVerificationStatus.VERIFIED]: [],
  [OrganizationVerificationStatus.REJECTED]: [OrganizationVerificationStatus.PENDING_REVIEW],
};

export function canTransitionOrganizationVerificationStatus(
  from: OrganizationVerificationStatus,
  to: OrganizationVerificationStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidOrganizationVerificationStatusTransition(
  from: OrganizationVerificationStatus,
  to: OrganizationVerificationStatus,
): void {
  if (!canTransitionOrganizationVerificationStatus(from, to)) {
    throw new Error(`Cannot transition organization verification status from ${from} to ${to}`);
  }
}
