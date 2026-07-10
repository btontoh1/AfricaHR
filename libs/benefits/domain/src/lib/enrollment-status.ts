// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase.
export const BenefitEnrollmentStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;

export type BenefitEnrollmentStatus =
  (typeof BenefitEnrollmentStatus)[keyof typeof BenefitEnrollmentStatus];

// CANCELLED is terminal — re-enrolling after cancellation creates a new
// enrollment row rather than reactivating the old one.
export function canCancelBenefitEnrollment(status: BenefitEnrollmentStatus): boolean {
  return status === BenefitEnrollmentStatus.ACTIVE;
}
