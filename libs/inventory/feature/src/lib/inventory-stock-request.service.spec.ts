import { ConflictException, ForbiddenException } from '@nestjs/common';
import { InventoryEmployeeRepository, InventoryStockRequestRepository } from '@africahr/inventory-data-access';
import { InventoryStockRequestService } from './inventory-stock-request.service';
import { InventoryStockService } from './inventory-stock.service';

describe('InventoryStockRequestService', () => {
  let service: InventoryStockRequestService;
  let requests: jest.Mocked<InventoryStockRequestRepository>;
  let employees: jest.Mocked<InventoryEmployeeRepository>;
  let stock: jest.Mocked<InventoryStockService>;

  beforeEach(() => {
    requests = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<InventoryStockRequestRepository>;
    employees = { findByUserId: jest.fn() } as unknown as jest.Mocked<InventoryEmployeeRepository>;
    stock = { issueGoods: jest.fn() } as unknown as jest.Mocked<InventoryStockService>;
    service = new InventoryStockRequestService(requests, employees, stock);
  });

  describe('createForSelf', () => {
    it('resolves the caller employee and creates the request', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as never);

      await service.createForSelf('tenant-1', 'user-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 5,
        reason: 'Need pens',
      });

      expect(requests.create).toHaveBeenCalledWith('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 5,
        requestedByEmployeeId: 'emp-1',
        reason: 'Need pens',
      });
    });

    it('throws ForbiddenException when the caller has no linked employee record', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(
        service.createForSelf('tenant-1', 'user-1', { warehouseId: 'wh-1', productId: 'prod-1', quantity: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelForSelf', () => {
    it('rejects cancelling someone else\'s request', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as never);
      requests.findById.mockResolvedValue({ id: 'req-1', requestedByEmployeeId: 'emp-2', status: 'PENDING' } as never);

      await expect(service.cancelForSelf('tenant-1', 'user-1', 'req-1')).rejects.toThrow(ForbiddenException);
    });

    it('rejects cancelling a request that is no longer PENDING', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as never);
      requests.findById.mockResolvedValue({ id: 'req-1', requestedByEmployeeId: 'emp-1', status: 'FULFILLED' } as never);

      await expect(service.cancelForSelf('tenant-1', 'user-1', 'req-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('approveAndFulfill', () => {
    it('issues stock tagged to the request and marks it FULFILLED', async () => {
      requests.findById.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 5,
        reason: 'Need pens',
      } as never);
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1' } as never);
      stock.issueGoods.mockResolvedValue([{ id: 'entry-1' }] as never);

      await service.approveAndFulfill('tenant-1', 'req-1', 'user-1');

      expect(stock.issueGoods).toHaveBeenCalledWith(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 5, reason: 'Need pens' },
        'user-1',
        { referenceType: 'StockRequest', referenceId: 'req-1' },
      );
      expect(requests.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'FULFILLED',
        reviewedByEmployeeId: 'mgr-emp-1',
        fulfilledLedgerEntryId: 'entry-1',
      });
    });

    it('rejects approving a request that is not PENDING', async () => {
      requests.findById.mockResolvedValue({ id: 'req-1', status: 'FULFILLED' } as never);

      await expect(service.approveAndFulfill('tenant-1', 'req-1', 'user-1')).rejects.toThrow(ConflictException);
      expect(stock.issueGoods).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('rejects a PENDING request with a review note', async () => {
      requests.findById.mockResolvedValue({ id: 'req-1', status: 'PENDING' } as never);
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1' } as never);

      await service.reject('tenant-1', 'req-1', { reviewNote: 'Out of budget' }, 'user-1');

      expect(requests.updateStatus).toHaveBeenCalledWith('tenant-1', 'req-1', {
        status: 'REJECTED',
        reviewedByEmployeeId: 'mgr-emp-1',
        reviewNote: 'Out of budget',
      });
    });
  });
});
