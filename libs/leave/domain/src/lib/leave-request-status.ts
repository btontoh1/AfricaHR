// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated LeaveRequestStatus without casts at the boundary.
export const LeaveRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];

// PENDING is the only non-terminal state. A request can still be cancelled
// after approval (e.g. plans changed before the leave starts) but not once
// rejected or already cancelled.
const ALLOWED_TRANSITIONS: Record<LeaveRequestStatus, LeaveRequestStatus[]> = {
  [LeaveRequestStatus.PENDING]: [
    LeaveRequestStatus.APPROVED,
    LeaveRequestStatus.REJECTED,
    LeaveRequestStatus.CANCELLED,
  ],
  [LeaveRequestStatus.APPROVED]: [LeaveRequestStatus.CANCELLED],
  [LeaveRequestStatus.REJECTED]: [],
  [LeaveRequestStatus.CANCELLED]: [],
};

export function canTransitionLeaveRequestStatus(
  from: LeaveRequestStatus,
  to: LeaveRequestStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
