// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated PerformanceReviewStatus without casts at the boundary.
export const PerformanceReviewStatus = {
  DRAFT: 'DRAFT',
  SELF_SUBMITTED: 'SELF_SUBMITTED',
  COMPLETED: 'COMPLETED',
} as const;

export type PerformanceReviewStatus =
  (typeof PerformanceReviewStatus)[keyof typeof PerformanceReviewStatus];

// The manager can complete a review directly from DRAFT (the employee never
// submitted a self-assessment) or from SELF_SUBMITTED (the normal path).
// COMPLETED is terminal.
const ALLOWED_TRANSITIONS: Record<PerformanceReviewStatus, PerformanceReviewStatus[]> = {
  [PerformanceReviewStatus.DRAFT]: [
    PerformanceReviewStatus.SELF_SUBMITTED,
    PerformanceReviewStatus.COMPLETED,
  ],
  [PerformanceReviewStatus.SELF_SUBMITTED]: [PerformanceReviewStatus.COMPLETED],
  [PerformanceReviewStatus.COMPLETED]: [],
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
