// Plain string-union (not a TS `enum`), same reasoning as
// @africahr/tenancy-domain's TenantStatus: stays structurally interchangeable
// with Prisma's generated PayRunStatus type without casts at the boundary.
export const PayRunStatus = {
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type PayRunStatus = (typeof PayRunStatus)[keyof typeof PayRunStatus];

// DRAFT: created, payslips not yet computed.
// PROCESSING: payslips computed, still recomputable, not yet locked.
// APPROVED: numbers locked; PAID: payment confirmed; CLOSED: archived.
// CANCELLED is terminal and reachable any time before PAID — once paid,
// real money has moved and the run can only proceed to CLOSED.
const ALLOWED_TRANSITIONS: Record<PayRunStatus, PayRunStatus[]> = {
  [PayRunStatus.DRAFT]: [PayRunStatus.PROCESSING, PayRunStatus.CANCELLED],
  [PayRunStatus.PROCESSING]: [PayRunStatus.APPROVED, PayRunStatus.CANCELLED],
  [PayRunStatus.APPROVED]: [PayRunStatus.PAID, PayRunStatus.CANCELLED],
  [PayRunStatus.PAID]: [PayRunStatus.CLOSED],
  [PayRunStatus.CLOSED]: [],
  [PayRunStatus.CANCELLED]: [],
};

export function canTransitionPayRunStatus(from: PayRunStatus, to: PayRunStatus): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Payslips are only safe to (re)compute while the run hasn't been locked yet.
export function isPayRunEditable(status: PayRunStatus): boolean {
  return status === PayRunStatus.DRAFT || status === PayRunStatus.PROCESSING;
}
