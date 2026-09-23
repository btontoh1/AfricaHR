import { FinanceService } from './finance.service';
import { InvoicingGlPostingListener } from './invoicing-gl-posting.listener';

describe('InvoicingGlPostingListener', () => {
  let listener: InvoicingGlPostingListener;
  let finance: jest.Mocked<FinanceService>;

  const basePayload = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    invoiceId: 'inv-1',
    entryDate: '2026-02-01T00:00:00.000Z',
    currency: 'GHS',
    subtotal: 1000,
    taxAmount: 150,
    total: 1150,
  };

  beforeEach(() => {
    finance = {
      postInvoiceSent: jest.fn(),
      postInvoicePaid: jest.fn(),
    } as unknown as jest.Mocked<FinanceService>;
    listener = new InvoicingGlPostingListener(finance);
  });

  it('posts on a transition to SENT', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'DRAFT', toStatus: 'SENT' });
    expect(finance.postInvoiceSent).toHaveBeenCalled();
    expect(finance.postInvoicePaid).not.toHaveBeenCalled();
  });

  it('posts on a transition to PAID', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'SENT', toStatus: 'PAID' });
    expect(finance.postInvoicePaid).toHaveBeenCalled();
    expect(finance.postInvoiceSent).not.toHaveBeenCalled();
  });

  it('ignores every other transition', async () => {
    await listener.handleStatusChanged({ ...basePayload, fromStatus: 'SENT', toStatus: 'OVERDUE' });
    expect(finance.postInvoiceSent).not.toHaveBeenCalled();
    expect(finance.postInvoicePaid).not.toHaveBeenCalled();
  });

  it('swallows a posting failure rather than letting it propagate', async () => {
    finance.postInvoiceSent.mockRejectedValue(new Error('db down'));
    await expect(
      listener.handleStatusChanged({ ...basePayload, fromStatus: 'DRAFT', toStatus: 'SENT' }),
    ).resolves.toBeUndefined();
  });
});
