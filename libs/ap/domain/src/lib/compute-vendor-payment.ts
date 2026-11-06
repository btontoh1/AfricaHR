import { VendorBillStatus } from './vendor-bill-status-transition';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * True for any status a bill can still receive a payment against - a DRAFT
 * bill isn't a real payable yet (not APPROVED), and PAID/CANCELLED are
 * terminal. Deliberately not expressed through
 * vendor-bill-status-transition.ts's ALLOWED_TRANSITIONS table - a second
 * partial payment against an already-PARTIALLY_PAID bill doesn't change its
 * status at all (still PARTIALLY_PAID), which that table treats as an
 * invalid no-op transition (see canTransitionBillStatus's `from === to`
 * check). This only answers "can a payment be applied right now", not "what
 * does applying one transition to".
 */
export function canReceivePayment(status: VendorBillStatus): boolean {
  return (
    status === VendorBillStatus.APPROVED ||
    status === VendorBillStatus.OVERDUE ||
    status === VendorBillStatus.PARTIALLY_PAID
  );
}

/** How much of this bill is still unpaid, as of its current amountPaid. */
export function computeRemainingBalance(total: number, amountPaid: number): number {
  return round2(total - amountPaid);
}

/** The bill's new status once newAmountPaid (its amountPaid plus this
 * payment's allocation) is applied - PAID once nothing remains, otherwise
 * PARTIALLY_PAID. Never returns to APPROVED/OVERDUE - once any money has
 * moved against a bill, it stays at least PARTIALLY_PAID. */
export function computeBillStatusAfterPayment(total: number, newAmountPaid: number): VendorBillStatus {
  return round2(total - newAmountPaid) <= 0 ? VendorBillStatus.PAID : VendorBillStatus.PARTIALLY_PAID;
}
