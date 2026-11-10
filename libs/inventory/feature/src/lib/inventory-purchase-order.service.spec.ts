import { ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryPurchaseOrderRepository, InventoryVendorRepository, InventoryWarehouseRepository } from '@africahr/inventory-data-access';
import { InventoryPurchaseOrderService } from './inventory-purchase-order.service';

describe('InventoryPurchaseOrderService', () => {
  let service: InventoryPurchaseOrderService;
  let purchaseOrders: jest.Mocked<InventoryPurchaseOrderRepository>;
  let warehouses: jest.Mocked<InventoryWarehouseRepository>;
  let vendors: jest.Mocked<InventoryVendorRepository>;

  beforeEach(() => {
    purchaseOrders = {
      create: jest.fn(),
      createFromRequisition: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<InventoryPurchaseOrderRepository>;
    warehouses = { findById: jest.fn() } as unknown as jest.Mocked<InventoryWarehouseRepository>;
    vendors = { findById: jest.fn() } as unknown as jest.Mocked<InventoryVendorRepository>;
    service = new InventoryPurchaseOrderService(purchaseOrders, warehouses, vendors);
  });

  describe('create', () => {
    it('validates the warehouse and vendor exist before creating', async () => {
      warehouses.findById.mockResolvedValue({ id: 'wh-1', organizationId: 'org-1' } as never);
      vendors.findById.mockResolvedValue({ id: 'vendor-1' } as never);

      await service.create(
        'tenant-1',
        { warehouseId: 'wh-1', vendorId: 'vendor-1', poNumber: 'PO-0001', lines: [{ productId: 'prod-1', quantity: 10, unitCost: 5 }] },
        'user-1',
      );

      expect(purchaseOrders.create).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        warehouseId: 'wh-1',
        vendorId: 'vendor-1',
        poNumber: 'PO-0001',
        expectedDate: undefined,
        notes: undefined,
        lines: [{ productId: 'prod-1', quantity: 10, unitCost: 5 }],
        createdBy: 'user-1',
      });
    });

    it('throws NotFoundException for an unknown vendor', async () => {
      warehouses.findById.mockResolvedValue({ id: 'wh-1', organizationId: 'org-1' } as never);
      vendors.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', { warehouseId: 'wh-1', vendorId: 'missing', poNumber: 'PO-0001', lines: [] }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('send', () => {
    it('sends a DRAFT purchase order', async () => {
      purchaseOrders.findById.mockResolvedValue({ id: 'po-1', status: 'DRAFT' } as never);

      await service.send('tenant-1', 'po-1', 'user-1');

      expect(purchaseOrders.updateStatus).toHaveBeenCalledWith('tenant-1', 'po-1', 'SENT', 'user-1');
    });

    it('rejects sending a PO that is not DRAFT', async () => {
      purchaseOrders.findById.mockResolvedValue({ id: 'po-1', status: 'SENT' } as never);

      await expect(service.send('tenant-1', 'po-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('rejects cancelling an already-RECEIVED purchase order', async () => {
      purchaseOrders.findById.mockResolvedValue({ id: 'po-1', status: 'RECEIVED' } as never);

      await expect(service.cancel('tenant-1', 'po-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});
