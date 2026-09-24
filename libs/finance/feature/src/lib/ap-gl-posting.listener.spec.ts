import { FinanceService } from './finance.service';
import { ApGlPostingListener } from './ap-gl-posting.listener';

describe('ApGlPostingListener', () => {
  let listener: ApGlPostingListener;
  let finance: jest.Mocked<FinanceService>;

  const basePayload = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    billId: 'bill-1',
    entryDate: '2026-02-01T00:00:00.000Z',
    currency: 'GHS',
    total: 1150,
  };

  beforeEach(() => {
    finance = {
      postVendorBillApproved: jest.fn(),
      postVendorBillPaid: jest.fn(),
    } as unknown as jest.Mocked<FinanceService>;
    listener = new ApGlPostingListener(finance);
  });

  it('posts on a transition to APPROVED', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'DRAFT', toStatus: 'APPROVED' });
    expect(finance.postVendorBillApproved).toHaveBeenCalled();
    expect(finance.postVendorBillPaid).not.toHaveBeenCalled();
  });

  it('posts on a transition to PAID', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'APPROVED', toStatus: 'PAID' });
    expect(finance.postVendorBillPaid).toHaveBeenCalled();
    expect(finance.postVendorBillApproved).not.toHaveBeenCalled();
  });

  it('ignores every other transition', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'APPROVED', toStatus: 'OVERDUE' });
    expect(finance.postVendorBillApproved).not.toHaveBeenCalled();
    expect(finance.postVendorBillPaid).not.toHaveBeenCalled();
  });

  it('swallows a posting failure rather than letting it propagate', async () => {
    finance.postVendorBillApproved.mockRejectedValue(new Error('db down'));
    await expect(
      listener.handleStatusChanged({ ...basePayload, fromStatus: 'DRAFT', toStatus: 'APPROVED' }),
    ).resolves.toBeUndefined();
  });
});
