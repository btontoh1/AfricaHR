import { PrismaService } from '@africahr/platform-database';
import { CompanyAssetRepository } from './company-asset.repository';

describe('CompanyAssetRepository', () => {
  let repository: CompanyAssetRepository;
  let tx: {
    companyAsset: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { companyAsset: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new CompanyAssetRepository(prisma as unknown as PrismaService);
  });

  it('creates an asset', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      assetTag: 'LAPTOP-001',
      name: 'MacBook Pro 14"',
      createdBy: 'user-1',
    });

    expect(tx.companyAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        assetTag: 'LAPTOP-001',
        name: 'MacBook Pro 14"',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      }),
    });
  });

  it('lists assets filtered by status', async () => {
    await repository.list('tenant-1', { status: 'AVAILABLE' });

    expect(tx.companyAsset.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        organizationId: undefined,
        status: 'AVAILABLE',
        assignedEmployeeId: undefined,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  });

  it('soft-deletes an asset', async () => {
    await repository.softDelete('tenant-1', 'asset-1', 'user-1');

    expect(tx.companyAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
    });
  });

  it('updates status directly (e.g. retiring an asset)', async () => {
    await repository.updateStatus('tenant-1', 'asset-1', 'RETIRED', 'user-1');

    expect(tx.companyAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: { status: 'RETIRED', updatedBy: 'user-1' },
    });
  });
});
