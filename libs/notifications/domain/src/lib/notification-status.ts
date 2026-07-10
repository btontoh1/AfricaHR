// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated NotificationStatus without casts at the boundary.
export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// A notification can only be marked read once it has actually been
// delivered — a still-PENDING or FAILED notification was never seen by
// its recipient, so "read" would be a lie.
export function canMarkRead(status: NotificationStatus): boolean {
  return status === NotificationStatus.SENT;
}
