import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CompanyAssetAssignmentRepository,
  CompanyAssetRepository,
  InventoryEmployeeRepository,
} from '@africahr/inventory-data-access';
import { CompanyAssetService } from './company-asset.service';

describe('CompanyAssetService', () => {
  let service: CompanyAssetService;
  let assets: jest.Mocked<CompanyAssetRepository>;
  let assignments: jest.Mocked<CompanyAssetAssignmentRepository>;
  let employees: jest.Mocked<InventoryEmployeeRepository>;

  beforeEach(() => {
    assets = {
      create: jest.fn(),
      findById: jest.fn(),
      findByAssetTag: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<CompanyAssetRepository>;
    assignments = {
      assign: jest.fn(),
      returnAsset: jest.fn(),
      listForAsset: jest.fn(),
      listForEmployee: jest.fn(),
    } as unknown as jest.Mocked<CompanyAssetAssignmentRepository>;
    employees = { findById: jest.fn(), findByUserId: jest.fn() } as unknown as jest.Mocked<InventoryEmployeeRepository>;
    service = new CompanyAssetService(assets, assignments, employees);
  });

  describe('create', () => {
    it('rejects a duplicate asset tag', async () => {
      assets.findByAssetTag.mockResolvedValue({ id: 'asset-1' } as never);

      await expect(
        service.create('tenant-1', { organizationId: 'org-1', assetTag: 'LAPTOP-001', name: 'MacBook' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(assets.create).not.toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('validates the employee exists before delegating to the assignment repository', async () => {
      employees.findById.mockResolvedValue({ id: 'emp-1' } as never);

      await service.assign('tenant-1', 'asset-1', { employeeId: 'emp-1', assignNote: 'New hire' }, 'user-1');

      expect(assignments.assign).toHaveBeenCalledWith('tenant-1', 'asset-1', {
        employeeId: 'emp-1',
        assignNote: 'New hire',
        assignedByUserId: 'user-1',
      });
    });

    it('throws NotFoundException for an unknown employee', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.assign('tenant-1', 'asset-1', { employeeId: 'missing' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('retire', () => {
    it('rejects retiring an asset that is currently assigned', async () => {
      assets.findById.mockResolvedValue({ id: 'asset-1', status: 'ASSIGNED' } as never);

      await expect(service.retire('tenant-1', 'asset-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('retires an available asset', async () => {
      assets.findById.mockResolvedValue({ id: 'asset-1', status: 'AVAILABLE' } as never);

      await service.retire('tenant-1', 'asset-1', 'user-1');

      expect(assets.updateStatus).toHaveBeenCalledWith('tenant-1', 'asset-1', 'RETIRED', 'user-1');
    });
  });

  describe('listForSelf', () => {
    it('resolves the caller employee and lists their assignment history', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as never);

      await service.listForSelf('tenant-1', 'user-1');

      expect(assignments.listForEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
    });

    it('throws ForbiddenException when the caller has no linked employee record', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.listForSelf('tenant-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
