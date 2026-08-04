// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated PerformanceReviewStatus without casts at the boundary.
export const PerformanceReviewStatus = {
  DRAFT: 'DRAFT',
  SELF_SUBMITTED: 'SELF_SUBMITTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type PerformanceReviewStatus =
  (typeof PerformanceReviewStatus)[keyof typeof PerformanceReviewStatus];

// The manager can complete a review directly from DRAFT (the employee never
// submitted a self-assessment) or from SELF_SUBMITTED (the normal path).
// A review can also be cancelled from either of those same two states (e.g.
// started for the wrong employee/cycle) - but not from COMPLETED, since a
// finished review is a finalized record, not a mistake to undo. COMPLETED
// and CANCELLED are both terminal.
const ALLOWED_TRANSITIONS: Record<PerformanceReviewStatus, PerformanceReviewStatus[]> = {
  [PerformanceReviewStatus.DRAFT]: [
    PerformanceReviewStatus.SELF_SUBMITTED,
    PerformanceReviewStatus.COMPLETED,
    PerformanceReviewStatus.CANCELLED,
  ],
  [PerformanceReviewStatus.SELF_SUBMITTED]: [
    PerformanceReviewStatus.COMPLETED,
    PerformanceReviewStatus.CANCELLED,
  ],
  [PerformanceReviewStatus.COMPLETED]: [],
  [PerformanceReviewStatus.CANCELLED]: [],
};

export function canTransitionReviewStatus(
  from: PerformanceReviewStatus,
  to: PerformanceReviewStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
