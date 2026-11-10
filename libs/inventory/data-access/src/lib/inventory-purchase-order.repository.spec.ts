import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { InventoryPurchaseOrderRepository } from './inventory-purchase-order.repository';

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), { code, message: 'mock' });
}

describe('InventoryPurchaseOrderRepository', () => {
  let repository: InventoryPurchaseOrderRepository;
  let tx: {
    inventoryPurchaseOrder: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    inventoryPurchaseOrderLine: { findFirst: jest.Mock };
    inventoryPurchaseRequisition: { findFirst: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      inventoryPurchaseOrder: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      inventoryPurchaseOrderLine: { findFirst: jest.fn() },
      inventoryPurchaseRequisition: { findFirst: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryPurchaseOrderRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a PO with nested lines', async () => {
      await repository.create('tenant-1', {
        organizationId: 'org-1',
        warehouseId: 'wh-1',
        vendorId: 'vendor-1',
        poNumber: 'PO-0001',
        lines: [{ productId: 'prod-1', quantity: 10, unitCost: 5 }],
        createdBy: 'user-1',
      });

      expect(tx.inventoryPurchaseOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          vendorId: 'vendor-1',
          poNumber: 'PO-0001',
          lines: { create: [{ tenantId: 'tenant-1', productId: 'prod-1', quantity: 10, unitCost: 5 }] },
        }),
        include: { lines: true },
      });
    });

    it('reports a duplicate PO number as a ConflictException', async () => {
      tx.inventoryPurchaseOrder.create.mockRejectedValue(knownRequestError('P2002'));

      await expect(
        repository.create('tenant-1', {
          organizationId: 'org-1',
          warehouseId: 'wh-1',
          vendorId: 'vendor-1',
          poNumber: 'PO-0001',
          lines: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createFromRequisition', () => {
    it('copies lines from an approved requisition and marks it CONVERTED', async () => {
      tx.inventoryPurchaseRequisition.findFirst.mockResolvedValue({
        id: 'req-1',
        organizationId: 'org-1',
        warehouseId: 'wh-1',
        status: 'APPROVED',
        lines: [{ productId: 'prod-1', quantity: 20, estimatedUnitCost: 3 }],
      });
      tx.inventoryPurchaseOrder.create.mockResolvedValue({ id: 'po-1', lines: [] });

      await repository.createFromRequisition('tenant-1', 'req-1', { vendorId: 'vendor-1', poNumber: 'PO-0002' });

      expect(tx.inventoryPurchaseOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          warehouseId: 'wh-1',
          vendorId: 'vendor-1',
          requisitionId: 'req-1',
          poNumber: 'PO-0002',
          lines: { create: [{ tenantId: 'tenant-1', productId: 'prod-1', quantity: 20, unitCost: 3 }] },
        }),
        include: { lines: true },
      });
      expect(tx.inventoryPurchaseRequisition.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: 'CONVERTED' },
      });
    });

    it('rejects converting a requisition that is not APPROVED', async () => {
      tx.inventoryPurchaseRequisition.findFirst.mockResolvedValue({ id: 'req-1', status: 'SUBMITTED', lines: [] });

      await expect(
        repository.createFromRequisition('tenant-1', 'req-1', { vendorId: 'vendor-1', poNumber: 'PO-0002' }),
      ).rejects.toThrow(ConflictException);
      expect(tx.inventoryPurchaseOrder.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing requisition', async () => {
      tx.inventoryPurchaseRequisition.findFirst.mockResolvedValue(null);

      await expect(
        repository.createFromRequisition('tenant-1', 'missing', { vendorId: 'vendor-1', poNumber: 'PO-0002' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('updates PO status', async () => {
    await repository.updateStatus('tenant-1', 'po-1', 'SENT', 'user-1');

    expect(tx.inventoryPurchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'SENT', updatedBy: 'user-1' },
    });
  });
});
