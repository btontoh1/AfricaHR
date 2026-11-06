// Plain string-union (not a TS `enum`) so this stays structurally
// interchangeable with Prisma's generated CustomerInvoiceStatus type, which
// is itself a string union — the two must never need a cast at the boundary.
export const CustomerInvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type CustomerInvoiceStatus = (typeof CustomerInvoiceStatus)[keyof typeof CustomerInvoiceStatus];

// OVERDUE is reachable only from SENT (a Draft was never sent, so it can't
// have gone overdue) - marking one Overdue is a manual action here (see
// project scope: no scheduled job auto-flips Sent invoices past their due
// date in v1), same as every other transition in this table.
const ALLOWED_TRANSITIONS: Record<CustomerInvoiceStatus, CustomerInvoiceStatus[]> = {
  [CustomerInvoiceStatus.DRAFT]: [CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.CANCELLED],
  [CustomerInvoiceStatus.SENT]: [
    CustomerInvoiceStatus.PAID,
    CustomerInvoiceStatus.OVERDUE,
    CustomerInvoiceStatus.CANCELLED,
  ],
  [CustomerInvoiceStatus.OVERDUE]: [CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.CANCELLED],
  [CustomerInvoiceStatus.PAID]: [],
  [CustomerInvoiceStatus.CANCELLED]: [],
};

export function canTransitionInvoiceStatus(from: CustomerInvoiceStatus, to: CustomerInvoiceStatus): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidInvoiceStatusTransition(from: CustomerInvoiceStatus, to: CustomerInvoiceStatus): void {
  if (!canTransitionInvoiceStatus(from, to)) {
    throw new Error(`Cannot transition invoice status from ${from} to ${to}`);
  }
}
