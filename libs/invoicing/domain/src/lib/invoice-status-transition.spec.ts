import {
  assertValidInvoiceStatusTransition,
  canTransitionInvoiceStatus,
  CustomerInvoiceStatus,
} from './invoice-status-transition';

describe('canTransitionInvoiceStatus', () => {
  it('allows the normal lifecycle: DRAFT -> SENT -> PAID', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.DRAFT, CustomerInvoiceStatus.SENT)).toBe(true);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.PAID)).toBe(true);
  });

  it('allows a Draft to be cancelled directly, without ever being sent', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.DRAFT, CustomerInvoiceStatus.CANCELLED)).toBe(true);
  });

  it('allows a Sent invoice to be marked Overdue or Cancelled', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.OVERDUE)).toBe(true);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.CANCELLED)).toBe(true);
  });

  it('allows an Overdue invoice to still be marked Paid or Cancelled', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.OVERDUE, CustomerInvoiceStatus.PAID)).toBe(true);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.OVERDUE, CustomerInvoiceStatus.CANCELLED)).toBe(true);
  });

  it('rejects a Draft going straight to Paid or Overdue, skipping Sent', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.DRAFT, CustomerInvoiceStatus.PAID)).toBe(false);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.DRAFT, CustomerInvoiceStatus.OVERDUE)).toBe(false);
  });

  it('rejects any transition out of Paid - it is a terminal state', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.SENT)).toBe(false);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.CANCELLED)).toBe(false);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.DRAFT)).toBe(false);
  });

  it('rejects any transition out of Cancelled - it is a terminal state', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.CANCELLED, CustomerInvoiceStatus.DRAFT)).toBe(false);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.CANCELLED, CustomerInvoiceStatus.SENT)).toBe(false);
  });

  it('rejects a no-op transition to the same status', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.SENT)).toBe(false);
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.PAID)).toBe(false);
  });

  it('rejects reverting a Sent invoice back to Draft', () => {
    expect(canTransitionInvoiceStatus(CustomerInvoiceStatus.SENT, CustomerInvoiceStatus.DRAFT)).toBe(false);
  });
});

describe('assertValidInvoiceStatusTransition', () => {
  it('does not throw for an allowed transition', () => {
    expect(() =>
      assertValidInvoiceStatusTransition(CustomerInvoiceStatus.DRAFT, CustomerInvoiceStatus.SENT),
    ).not.toThrow();
  });

  it('throws a descriptive error for a disallowed transition', () => {
    expect(() =>
      assertValidInvoiceStatusTransition(CustomerInvoiceStatus.PAID, CustomerInvoiceStatus.DRAFT),
    ).toThrow('Cannot transition invoice status from PAID to DRAFT');
  });
});
