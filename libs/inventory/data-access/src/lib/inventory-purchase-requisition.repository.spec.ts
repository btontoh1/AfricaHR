import { PrismaService } from '@africahr/platform-database';
import { InventoryPurchaseRequisitionRepository } from './inventory-purchase-requisition.repository';

describe('InventoryPurchaseRequisitionRepository', () => {
  let repository: InventoryPurchaseRequisitionRepository;
  let tx: { inventoryPurchaseRequisition: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      inventoryPurchaseRequisition: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryPurchaseRequisitionRepository(prisma as unknown as PrismaService);
  });

  it('creates a requisition with nested lines', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      warehouseId: 'wh-1',
      requestedByEmployeeId: 'emp-1',
      notes: 'Running low',
      lines: [{ productId: 'prod-1', quantity: 20, estimatedUnitCost: 2.5 }],
      createdBy: 'user-1',
    });

    expect(tx.inventoryPurchaseRequisition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        warehouseId: 'wh-1',
        requestedByEmployeeId: 'emp-1',
        notes: 'Running low',
        createdBy: 'user-1',
        updatedBy: 'user-1',
        lines: { create: [{ tenantId: 'tenant-1', productId: 'prod-1', quantity: 20, estimatedUnitCost: 2.5 }] },
      }),
      include: { lines: true },
    });
  });

  it('lists requisitions filtered by status, including lines', async () => {
    await repository.list('tenant-1', { status: 'SUBMITTED' });

    expect(tx.inventoryPurchaseRequisition.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', warehouseId: undefined, status: 'SUBMITTED', requestedByEmployeeId: undefined },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status with reviewer and note', async () => {
    await repository.updateStatus('tenant-1', 'req-1', {
      status: 'APPROVED',
      reviewedByEmployeeId: 'mgr-1',
      reviewNote: 'Looks good',
      updatedBy: 'user-1',
    });

    expect(tx.inventoryPurchaseRequisition.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { status: 'APPROVED', reviewedByEmployeeId: 'mgr-1', reviewNote: 'Looks good', updatedBy: 'user-1' },
    });
  });
});
