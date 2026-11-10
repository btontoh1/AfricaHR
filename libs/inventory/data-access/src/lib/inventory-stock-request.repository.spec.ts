import { PrismaService } from '@africahr/platform-database';
import { InventoryStockRequestRepository } from './inventory-stock-request.repository';

describe('InventoryStockRequestRepository', () => {
  let repository: InventoryStockRequestRepository;
  let tx: { inventoryStockRequest: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryStockRequest: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryStockRequestRepository(prisma as unknown as PrismaService);
  });

  it('creates a stock request', async () => {
    await repository.create('tenant-1', {
      warehouseId: 'wh-1',
      productId: 'prod-1',
      quantity: 5,
      requestedByEmployeeId: 'emp-1',
      reason: 'Need stationery',
    });

    expect(tx.inventoryStockRequest.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 5,
        requestedByEmployeeId: 'emp-1',
        reason: 'Need stationery',
      },
    });
  });

  it('lists requests filtered by requester', async () => {
    await repository.list('tenant-1', { requestedByEmployeeId: 'emp-1' });

    expect(tx.inventoryStockRequest.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', requestedByEmployeeId: 'emp-1', status: undefined, warehouseId: undefined },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status with reviewer and fulfillment reference', async () => {
    await repository.updateStatus('tenant-1', 'req-1', {
      status: 'FULFILLED',
      reviewedByEmployeeId: 'mgr-1',
      fulfilledLedgerEntryId: 'entry-1',
    });

    expect(tx.inventoryStockRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: {
        status: 'FULFILLED',
        reviewedByEmployeeId: 'mgr-1',
        reviewNote: undefined,
        fulfilledLedgerEntryId: 'entry-1',
      },
    });
  });
});
