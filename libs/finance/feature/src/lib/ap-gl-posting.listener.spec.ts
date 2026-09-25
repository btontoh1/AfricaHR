import { FinanceService } from './finance.service';
import { ApGlPostingListener } from './ap-gl-posting.listener';

describe('ApGlPostingListener', () => {
  let listener: ApGlPostingListener;
  let finance: jest.Mocked<FinanceService>;

  const statusChangedPayload = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    billId: 'bill-1',
    entryDate: '2026-02-01T00:00:00.000Z',
    currency: 'GHS',
    total: 1150,
  };

  const paymentRecordedPayload = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    paymentId: 'payment-1',
    entryDate: '2026-02-01T00:00:00.000Z',
    currency: 'GHS',
    amount: 1150,
  };

  beforeEach(() => {
    finance = {
      postVendorBillApproved: jest.fn(),
      postVendorPayment: jest.fn(),
    } as unknown as jest.Mocked<FinanceService>;
    listener = new ApGlPostingListener(finance);
  });

  describe('handleStatusChanged', () => {
    it('posts on a transition to APPROVED', async () => {
      await listener.handleStatusChanged({ ...statusChangedPayload, fromStatus: 'DRAFT', toStatus: 'APPROVED' });
      expect(finance.postVendorBillApproved).toHaveBeenCalled();
    });

    it('ignores every other transition', async () => {
      await listener.handleStatusChanged({ ...statusChangedPayload, fromStatus: 'APPROVED', toStatus: 'OVERDUE' });
      expect(finance.postVendorBillApproved).not.toHaveBeenCalled();
    });

    it('swallows a posting failure rather than letting it propagate', async () => {
      finance.postVendorBillApproved.mockRejectedValue(new Error('db down'));
      await expect(
        listener.handleStatusChanged({ ...statusChangedPayload, fromStatus: 'DRAFT', toStatus: 'APPROVED' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('handleVendorPaymentRecorded', () => {
    it('posts the combined payment amount', async () => {
      await listener.handleVendorPaymentRecorded(paymentRecordedPayload);
      expect(finance.postVendorPayment).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        paymentId: 'payment-1',
        entryDate: new Date('2026-02-01T00:00:00.000Z'),
        currency: 'GHS',
        amount: 1150,
      });
    });

    it('swallows a posting failure rather than letting it propagate', async () => {
      finance.postVendorPayment.mockRejectedValue(new Error('db down'));
      await expect(listener.handleVendorPaymentRecorded(paymentRecordedPayload)).resolves.toBeUndefined();
    });
  });
});
