// Plain string-union (not a TS `enum`) so this stays structurally
// interchangeable with Prisma's generated VendorBillStatus type, same
// reasoning as invoicing-domain's CustomerInvoiceStatus.
export const VendorBillStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type VendorBillStatus = (typeof VendorBillStatus)[keyof typeof VendorBillStatus];

/** Every target VendorPaymentService's recordPayment flow may set directly -
 * never reachable through VendorBillService.updateStatus (see its own
 * rejection of these two targets). */
export const PAYMENT_DRIVEN_STATUSES: readonly VendorBillStatus[] = [
  VendorBillStatus.PARTIALLY_PAID,
  VendorBillStatus.PAID,
];

// Mirrors invoicing-domain's CustomerInvoiceStatus transition table, plus
// PARTIALLY_PAID/PAID - APPROVED is this model's equivalent of SENT (see the
// schema's own doc comment on VendorBill for why). OVERDUE is reachable only
// from APPROVED, same reasoning as invoicing: marking one overdue is a
// manual action, no scheduled job flips it automatically in v1.
// PARTIALLY_PAID/PAID are only ever reached via VendorPaymentService, never
// through VendorBillService.updateStatus (see PAYMENT_DRIVEN_STATUSES) - they
// still appear here because this table is the one source of truth for the
// full state graph, including transitions the payment flow drives.
// PARTIALLY_PAID can only ever advance to PAID (a partially-paid bill has
// real money against it - it can't be cancelled without first reversing that
// payment, which is out of scope for v1).
const ALLOWED_TRANSITIONS: Record<VendorBillStatus, VendorBillStatus[]> = {
  [VendorBillStatus.DRAFT]: [VendorBillStatus.APPROVED, VendorBillStatus.CANCELLED],
  [VendorBillStatus.APPROVED]: [
    VendorBillStatus.PARTIALLY_PAID,
    VendorBillStatus.PAID,
    VendorBillStatus.OVERDUE,
    VendorBillStatus.CANCELLED,
  ],
  [VendorBillStatus.OVERDUE]: [VendorBillStatus.PARTIALLY_PAID, VendorBillStatus.PAID, VendorBillStatus.CANCELLED],
  [VendorBillStatus.PARTIALLY_PAID]: [VendorBillStatus.PAID],
  [VendorBillStatus.PAID]: [],
  [VendorBillStatus.CANCELLED]: [],
};

export function canTransitionBillStatus(from: VendorBillStatus, to: VendorBillStatus): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidBillStatusTransition(from: VendorBillStatus, to: VendorBillStatus): void {
  if (!canTransitionBillStatus(from, to)) {
    throw new Error(`Cannot transition vendor bill status from ${from} to ${to}`);
  }
}
