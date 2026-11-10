import { PrismaService } from '@africahr/platform-database';
import { ProcurementSpendReportRepository } from './procurement-spend-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('ProcurementSpendReportRepository', () => {
  let repository: ProcurementSpendReportRepository;
  let tx: { inventoryPurchaseOrder: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryPurchaseOrder: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new ProcurementSpendReportRepository(prisma as unknown as PrismaService);
  });

  it('returns an empty array when there are no matching purchase orders', async () => {
    tx.inventoryPurchaseOrder.findMany.mockResolvedValue([]);

    const result = await repository.listSpendLines('tenant-1');

    expect(result).toEqual([]);
  });

  it('sums each order line into a single lineTotal per order', async () => {
    tx.inventoryPurchaseOrder.findMany.mockResolvedValue([
      {
        id: 'po-1',
        vendorId: 'vendor-1',
        orderDate: new Date('2026-02-10'),
        vendor: { name: 'Acme Supplies' },
        lines: [
          { quantity: decimal(10), unitCost: decimal(5) },
          { quantity: decimal(2), unitCost: decimal(50) },
        ],
      },
    ]);

    const result = await repository.listSpendLines('tenant-1');

    expect(result).toEqual([
      {
        vendorId: 'vendor-1',
        vendorName: 'Acme Supplies',
        orderDate: new Date('2026-02-10'),
        lineTotal: 150,
        purchaseOrderId: 'po-1',
      },
    ]);
  });

  it('only queries SENT/PARTIALLY_RECEIVED/RECEIVED orders', async () => {
    tx.inventoryPurchaseOrder.findMany.mockResolvedValue([]);

    await repository.listSpendLines('tenant-1', { vendorId: 'vendor-1' });

    expect(tx.inventoryPurchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vendorId: 'vendor-1',
          status: { in: ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'] },
        }),
      }),
    );
  });
});
