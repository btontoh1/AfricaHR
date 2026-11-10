import { PrismaService } from '@africahr/platform-database';
import { VendorBillService } from './vendor-bill.service';
import { InventoryReceiptBillListener } from './inventory-receipt-bill.listener';

describe('InventoryReceiptBillListener', () => {
  let listener: InventoryReceiptBillListener;
  let prisma: jest.Mocked<PrismaService>;
  let vendorBills: jest.Mocked<VendorBillService>;

  const payload = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    purchaseOrderId: 'po-1',
    poNumber: 'PO-0001',
    vendorId: 'vendor-1',
    warehouseId: 'wh-1',
    productId: 'prod-1',
    productName: 'PARA-500 - Paracetamol 500mg',
    quantity: 20,
    unitCost: 9.99,
    ledgerEntryId: 'entry-1',
    receivedAt: '2026-03-01T00:00:00.000Z',
  };

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    vendorBills = { create: jest.fn() } as unknown as jest.Mocked<VendorBillService>;
    listener = new InventoryReceiptBillListener(prisma, vendorBills);
  });

  it('does nothing when FINANCE is not enabled for the tenant', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ enabledAddOns: ['INVENTORY'] });

    await listener.handleGoodsReceived(payload);

    expect(vendorBills.create).not.toHaveBeenCalled();
  });

  it('does nothing when the tenant cannot be found', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    await listener.handleGoodsReceived(payload);

    expect(vendorBills.create).not.toHaveBeenCalled();
  });

  it('drafts a vendor bill when FINANCE is enabled', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ enabledAddOns: ['INVENTORY', 'FINANCE'] });

    await listener.handleGoodsReceived(payload);

    expect(vendorBills.create).toHaveBeenCalledTimes(1);
    const [tenantId, dto, actor] = (vendorBills.create as jest.Mock).mock.calls[0];
    expect(tenantId).toBe('tenant-1');
    expect(dto).toMatchObject({
      organizationId: 'org-1',
      vendorId: 'vendor-1',
      vendorReference: 'PO PO-0001',
      billDate: '2026-03-01',
      currency: 'GHS',
      lineItems: [{ description: 'PARA-500 - Paracetamol 500mg', quantity: 20, unitPrice: 9.99 }],
    });
    expect(dto.dueDate).toBe('2026-03-31');
    expect(actor).toMatchObject({ sub: 'system:inventory-receipt', tenantId: 'tenant-1' });
  });

  it('swallows a VendorBillService.create failure rather than letting it propagate', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ enabledAddOns: ['FINANCE'] });
    (vendorBills.create as jest.Mock).mockRejectedValue(new Error('vendor not found'));

    await expect(listener.handleGoodsReceived(payload)).resolves.toBeUndefined();
  });
});
