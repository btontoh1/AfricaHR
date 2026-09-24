// Plain string-union (not a TS `enum`) so this stays structurally
// interchangeable with Prisma's generated VendorBillStatus type, same
// reasoning as invoicing-domain's CustomerInvoiceStatus.
export const VendorBillStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type VendorBillStatus = (typeof VendorBillStatus)[keyof typeof VendorBillStatus];

// Mirrors invoicing-domain's CustomerInvoiceStatus transition table exactly -
// APPROVED is this model's equivalent of SENT (see the schema's own doc
// comment on VendorBill for why). OVERDUE is reachable only from APPROVED,
// same reasoning as invoicing: marking one overdue is a manual action, no
// scheduled job flips it automatically in v1.
const ALLOWED_TRANSITIONS: Record<VendorBillStatus, VendorBillStatus[]> = {
  [VendorBillStatus.DRAFT]: [VendorBillStatus.APPROVED, VendorBillStatus.CANCELLED],
  [VendorBillStatus.APPROVED]: [VendorBillStatus.PAID, VendorBillStatus.OVERDUE, VendorBillStatus.CANCELLED],
  [VendorBillStatus.OVERDUE]: [VendorBillStatus.PAID, VendorBillStatus.CANCELLED],
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
