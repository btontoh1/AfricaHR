import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  InventoryEmployeeRepository,
  InventoryPurchaseRequisitionRepository,
  InventoryWarehouseRepository,
} from '@africahr/inventory-data-access';
import { InventoryRequisitionService } from './inventory-requisition.service';

describe('InventoryRequisitionService', () => {
  let service: InventoryRequisitionService;
  let requisitions: jest.Mocked<InventoryPurchaseRequisitionRepository>;
  let warehouses: jest.Mocked<InventoryWarehouseRepository>;
  let employees: jest.Mocked<InventoryEmployeeRepository>;

  beforeEach(() => {
    requisitions = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<InventoryPurchaseRequisitionRepository>;
    warehouses = { findById: jest.fn() } as unknown as jest.Mocked<InventoryWarehouseRepository>;
    employees = { findById: jest.fn(), findByUserId: jest.fn() } as unknown as jest.Mocked<InventoryEmployeeRepository>;
    service = new InventoryRequisitionService(requisitions, warehouses, employees);
  });

  describe('create', () => {
    it('resolves organizationId from the warehouse and validates the requester exists', async () => {
      warehouses.findById.mockResolvedValue({ id: 'wh-1', organizationId: 'org-1' } as never);
      employees.findById.mockResolvedValue({ id: 'emp-1' } as never);

      await service.create(
        'tenant-1',
        { warehouseId: 'wh-1', requestedByEmployeeId: 'emp-1', lines: [{ productId: 'prod-1', quantity: 10 }] },
        'user-1',
      );

      expect(requisitions.create).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        warehouseId: 'wh-1',
        requestedByEmployeeId: 'emp-1',
        notes: undefined,
        lines: [{ productId: 'prod-1', quantity: 10 }],
        createdBy: 'user-1',
      });
    });

    it('throws NotFoundException for an unknown warehouse', async () => {
      warehouses.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', { warehouseId: 'missing', requestedByEmployeeId: 'emp-1', lines: [] }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit/approve/reject', () => {
    it('submits a DRAFT requisition', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'DRAFT' } as never);

      await service.submit('tenant-1', 'req-1', 'user-1');

      expect(requisitions.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'SUBMITTED',
        updatedBy: 'user-1',
      });
    });

    it('rejects submitting a requisition that is not DRAFT', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'SUBMITTED' } as never);

      await expect(service.submit('tenant-1', 'req-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('approves a SUBMITTED requisition, resolving the reviewer employee', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'SUBMITTED' } as never);
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1' } as never);

      await service.approve('tenant-1', 'req-1', { reviewNote: 'Go ahead' }, 'user-1');

      expect(requisitions.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'APPROVED',
        reviewedByEmployeeId: 'mgr-emp-1',
        reviewNote: 'Go ahead',
        updatedBy: 'user-1',
      });
    });

    it('rejects a SUBMITTED requisition with a review note', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'SUBMITTED' } as never);
      employees.findByUserId.mockResolvedValue(null);

      await service.reject('tenant-1', 'req-1', { reviewNote: 'Over budget' }, 'user-1');

      expect(requisitions.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'REJECTED',
        reviewedByEmployeeId: undefined,
        reviewNote: 'Over budget',
        updatedBy: 'user-1',
      });
    });
  });

  describe('cancel', () => {
    it('cancels a non-converted requisition', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'DRAFT' } as never);

      await service.cancel('tenant-1', 'req-1', 'user-1');

      expect(requisitions.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'CANCELLED',
        updatedBy: 'user-1',
      });
    });

    it('rejects cancelling a requisition already converted to a PO', async () => {
      requisitions.findById.mockResolvedValue({ id: 'req-1', status: 'CONVERTED' } as never);

      await expect(service.cancel('tenant-1', 'req-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});
