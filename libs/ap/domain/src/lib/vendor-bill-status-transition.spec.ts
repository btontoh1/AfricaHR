import { assertValidBillStatusTransition, canTransitionBillStatus, VendorBillStatus } from './vendor-bill-status-transition';

describe('canTransitionBillStatus', () => {
  it('allows the normal lifecycle: DRAFT -> APPROVED -> PAID', () => {
    expect(canTransitionBillStatus(VendorBillStatus.DRAFT, VendorBillStatus.APPROVED)).toBe(true);
    expect(canTransitionBillStatus(VendorBillStatus.APPROVED, VendorBillStatus.PAID)).toBe(true);
  });

  it('allows a Draft to be cancelled directly, without ever being approved', () => {
    expect(canTransitionBillStatus(VendorBillStatus.DRAFT, VendorBillStatus.CANCELLED)).toBe(true);
  });

  it('allows an Approved bill to be marked Overdue or Cancelled', () => {
    expect(canTransitionBillStatus(VendorBillStatus.APPROVED, VendorBillStatus.OVERDUE)).toBe(true);
    expect(canTransitionBillStatus(VendorBillStatus.APPROVED, VendorBillStatus.CANCELLED)).toBe(true);
  });

  it('allows an Overdue bill to still be marked Paid or Cancelled', () => {
    expect(canTransitionBillStatus(VendorBillStatus.OVERDUE, VendorBillStatus.PAID)).toBe(true);
    expect(canTransitionBillStatus(VendorBillStatus.OVERDUE, VendorBillStatus.CANCELLED)).toBe(true);
  });

  it('rejects a Draft going straight to Paid or Overdue, skipping Approved', () => {
    expect(canTransitionBillStatus(VendorBillStatus.DRAFT, VendorBillStatus.PAID)).toBe(false);
    expect(canTransitionBillStatus(VendorBillStatus.DRAFT, VendorBillStatus.OVERDUE)).toBe(false);
  });

  it('rejects any transition out of Paid - it is a terminal state', () => {
    expect(canTransitionBillStatus(VendorBillStatus.PAID, VendorBillStatus.APPROVED)).toBe(false);
    expect(canTransitionBillStatus(VendorBillStatus.PAID, VendorBillStatus.CANCELLED)).toBe(false);
    expect(canTransitionBillStatus(VendorBillStatus.PAID, VendorBillStatus.DRAFT)).toBe(false);
  });

  it('rejects any transition out of Cancelled - it is a terminal state', () => {
    expect(canTransitionBillStatus(VendorBillStatus.CANCELLED, VendorBillStatus.DRAFT)).toBe(false);
    expect(canTransitionBillStatus(VendorBillStatus.CANCELLED, VendorBillStatus.APPROVED)).toBe(false);
  });

  it('rejects a no-op transition to the same status', () => {
    expect(canTransitionBillStatus(VendorBillStatus.APPROVED, VendorBillStatus.APPROVED)).toBe(false);
    expect(canTransitionBillStatus(VendorBillStatus.PAID, VendorBillStatus.PAID)).toBe(false);
  });

  it('rejects reverting an Approved bill back to Draft', () => {
    expect(canTransitionBillStatus(VendorBillStatus.APPROVED, VendorBillStatus.DRAFT)).toBe(false);
  });
});

describe('assertValidBillStatusTransition', () => {
  it('does not throw for an allowed transition', () => {
    expect(() => assertValidBillStatusTransition(VendorBillStatus.DRAFT, VendorBillStatus.APPROVED)).not.toThrow();
  });

  it('throws a descriptive error for a disallowed transition', () => {
    expect(() => assertValidBillStatusTransition(VendorBillStatus.PAID, VendorBillStatus.DRAFT)).toThrow(
      'Cannot transition vendor bill status from PAID to DRAFT',
    );
  });
});
