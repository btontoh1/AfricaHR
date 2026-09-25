import { PrismaService } from '@africahr/platform-database';
import { GlFixedAssetRepository } from './gl-fixed-asset.repository';

describe('GlFixedAssetRepository', () => {
  let repository: GlFixedAssetRepository;
  let tx: {
    glFixedAsset: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glFixedAsset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlFixedAssetRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a fixed asset row with the given fields', async () => {
      tx.glFixedAsset.create.mockResolvedValue({ id: 'asset-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        description: 'Delivery van',
        currency: 'USD',
        cost: 12000,
        salvageValue: 2400,
        usefulLifeMonths: 24,
        acquisitionDate: new Date('2026-03-15'),
        nextDepreciationDate: new Date('2026-04-15'),
        createdBy: 'user-1',
      });

      expect(tx.glFixedAsset.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          description: 'Delivery van',
          currency: 'USD',
          cost: 12000,
          salvageValue: 2400,
          usefulLifeMonths: 24,
          acquisitionDate: new Date('2026-03-15'),
          nextDepreciationDate: new Date('2026-04-15'),
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
    });
  });

  describe('findById', () => {
    it('finds a fixed asset scoped to the tenant', async () => {
      await repository.findById('tenant-1', 'asset-1');

      expect(tx.glFixedAsset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-1', tenantId: 'tenant-1' },
      });
    });
  });

  describe('list', () => {
    it('lists fixed assets scoped to the tenant and organization, newest first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.glFixedAsset.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { acquisitionDate: 'desc' },
      });
    });
  });

  describe('listDueForDepreciation', () => {
    it('finds active assets in the organization/currency due by asOfDate', async () => {
      const asOfDate = new Date('2026-04-30');

      await repository.listDueForDepreciation('tenant-1', 'org-1', 'USD', asOfDate);

      expect(tx.glFixedAsset.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'USD',
          status: 'ACTIVE',
          nextDepreciationDate: { lte: asOfDate },
        },
        orderBy: { acquisitionDate: 'asc' },
      });
    });
  });

  describe('updateAfterDepreciation', () => {
    it('advances the schedule and updates accumulated depreciation', async () => {
      await repository.updateAfterDepreciation(
        'tenant-1',
        'asset-1',
        {
          accumulatedDepreciation: 400,
          lastDepreciationDate: new Date('2026-04-15'),
          nextDepreciationDate: new Date('2026-05-15'),
          status: 'ACTIVE',
        },
        'user-1',
      );

      expect(tx.glFixedAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: {
          accumulatedDepreciation: 400,
          lastDepreciationDate: new Date('2026-04-15'),
          nextDepreciationDate: new Date('2026-05-15'),
          status: 'ACTIVE',
          updatedBy: 'user-1',
        },
      });
    });

    it('clears nextDepreciationDate and flips status once fully depreciated', async () => {
      await repository.updateAfterDepreciation('tenant-1', 'asset-1', {
        accumulatedDepreciation: 9600,
        lastDepreciationDate: new Date('2026-03-15'),
        nextDepreciationDate: null,
        status: 'FULLY_DEPRECIATED',
      });

      expect(tx.glFixedAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: {
          accumulatedDepreciation: 9600,
          lastDepreciationDate: new Date('2026-03-15'),
          nextDepreciationDate: null,
          status: 'FULLY_DEPRECIATED',
          updatedBy: undefined,
        },
      });
    });
  });

  describe('dispose', () => {
    it('marks the asset disposed and stops future depreciation runs from picking it up', async () => {
      const disposedAt = new Date('2026-06-01');

      await repository.dispose('tenant-1', 'asset-1', disposedAt, 'user-1');

      expect(tx.glFixedAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: { status: 'DISPOSED', disposedAt, nextDepreciationDate: null, updatedBy: 'user-1' },
      });
    });
  });
});
