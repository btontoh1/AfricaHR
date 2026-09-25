import { canReceivePayment, computeBillStatusAfterPayment, computeRemainingBalance } from './compute-vendor-payment';
import { VendorBillStatus } from './vendor-bill-status-transition';

describe('canReceivePayment', () => {
  it('allows APPROVED, OVERDUE, and PARTIALLY_PAID bills', () => {
    expect(canReceivePayment(VendorBillStatus.APPROVED)).toBe(true);
    expect(canReceivePayment(VendorBillStatus.OVERDUE)).toBe(true);
    expect(canReceivePayment(VendorBillStatus.PARTIALLY_PAID)).toBe(true);
  });

  it('rejects DRAFT, PAID, and CANCELLED bills', () => {
    expect(canReceivePayment(VendorBillStatus.DRAFT)).toBe(false);
    expect(canReceivePayment(VendorBillStatus.PAID)).toBe(false);
    expect(canReceivePayment(VendorBillStatus.CANCELLED)).toBe(false);
  });
});

describe('computeRemainingBalance', () => {
  it('subtracts amountPaid from total', () => {
    expect(computeRemainingBalance(1000, 400)).toBe(600);
  });

  it('rounds to 2dp', () => {
    expect(computeRemainingBalance(100.1, 33.33)).toBe(66.77);
  });

  it('returns 0 for a fully paid bill', () => {
    expect(computeRemainingBalance(500, 500)).toBe(0);
  });
});

describe('computeBillStatusAfterPayment', () => {
  it('returns PARTIALLY_PAID when a balance remains', () => {
    expect(computeBillStatusAfterPayment(1000, 400)).toBe(VendorBillStatus.PARTIALLY_PAID);
  });

  it('returns PAID once the payment covers the total exactly', () => {
    expect(computeBillStatusAfterPayment(1000, 1000)).toBe(VendorBillStatus.PAID);
  });

  it('returns PAID even if somehow overpaid', () => {
    expect(computeBillStatusAfterPayment(1000, 1000.5)).toBe(VendorBillStatus.PAID);
  });
});
