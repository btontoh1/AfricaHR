import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';
import { CompanyAssetAssignmentRepository } from './company-asset-assignment.repository';

describe('CompanyAssetAssignmentRepository', () => {
  let repository: CompanyAssetAssignmentRepository;
  let tx: {
    companyAsset: { updateMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    companyAssetAssignment: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      companyAsset: { updateMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      companyAssetAssignment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new CompanyAssetAssignmentRepository(prisma as unknown as PrismaService);
  });

  describe('assign', () => {
    it('marks the asset ASSIGNED and opens a new assignment when it was AVAILABLE', async () => {
      tx.companyAsset.updateMany.mockResolvedValue({ count: 1 });
      tx.companyAssetAssignment.create.mockResolvedValue({ id: 'assign-1' });

      await repository.assign('tenant-1', 'asset-1', { employeeId: 'emp-1', assignedByUserId: 'user-1' });

      expect(tx.companyAsset.updateMany).toHaveBeenCalledWith({
        where: { id: 'asset-1', tenantId: 'tenant-1', status: 'AVAILABLE', deletedAt: null },
        data: { status: 'ASSIGNED', assignedEmployeeId: 'emp-1' },
      });
      expect(tx.companyAssetAssignment.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', assetId: 'asset-1', employeeId: 'emp-1', assignNote: undefined, assignedByUserId: 'user-1' },
      });
    });

    it('rejects assigning an asset that is not available, without creating an assignment', async () => {
      tx.companyAsset.updateMany.mockResolvedValue({ count: 0 });
      tx.companyAsset.findFirst.mockResolvedValue({ id: 'asset-1', assetTag: 'LAPTOP-001', status: 'ASSIGNED' });

      await expect(repository.assign('tenant-1', 'asset-1', { employeeId: 'emp-1' })).rejects.toThrow(
        ConflictException,
      );
      expect(tx.companyAssetAssignment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing asset', async () => {
      tx.companyAsset.updateMany.mockResolvedValue({ count: 0 });
      tx.companyAsset.findFirst.mockResolvedValue(null);

      await expect(repository.assign('tenant-1', 'missing', { employeeId: 'emp-1' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('returnAsset', () => {
    it('closes the open assignment and marks the asset AVAILABLE', async () => {
      tx.companyAssetAssignment.findFirst.mockResolvedValue({ id: 'assign-1', returnedAt: null });
      tx.companyAssetAssignment.update.mockResolvedValue({ id: 'assign-1', returnedAt: new Date() });

      await repository.returnAsset('tenant-1', 'asset-1', { returnNote: 'Good condition' });

      expect(tx.companyAssetAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
        data: { returnedAt: expect.any(Date), returnNote: 'Good condition' },
      });
      expect(tx.companyAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: { status: 'AVAILABLE', assignedEmployeeId: null },
      });
    });

    it('rejects returning an asset with no open assignment', async () => {
      tx.companyAssetAssignment.findFirst.mockResolvedValue(null);

      await expect(repository.returnAsset('tenant-1', 'asset-1')).rejects.toThrow(ConflictException);
      expect(tx.companyAsset.update).not.toHaveBeenCalled();
    });
  });
});
