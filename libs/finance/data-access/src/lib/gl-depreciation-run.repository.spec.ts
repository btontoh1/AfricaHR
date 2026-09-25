import { PrismaService } from '@africahr/platform-database';
import { GlDepreciationRunRepository } from './gl-depreciation-run.repository';

describe('GlDepreciationRunRepository', () => {
  let repository: GlDepreciationRunRepository;
  let tx: { glDepreciationRun: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glDepreciationRun: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlDepreciationRunRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a depreciation run row with the given fields', async () => {
      tx.glDepreciationRun.create.mockResolvedValue({ id: 'run-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-04-30'),
        totalDepreciation: 900,
        assetCount: 3,
        journalEntryId: 'entry-1',
        createdBy: 'user-1',
      });

      expect(tx.glDepreciationRun.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'USD',
          asOfDate: new Date('2026-04-30'),
          totalDepreciation: 900,
          assetCount: 3,
          journalEntryId: 'entry-1',
          createdBy: 'user-1',
        },
      });
    });

    it('omits journalEntryId when not given (nothing due, no posting)', async () => {
      tx.glDepreciationRun.create.mockResolvedValue({ id: 'run-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-04-30'),
        totalDepreciation: 0,
        assetCount: 0,
      });

      expect(tx.glDepreciationRun.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'USD',
          asOfDate: new Date('2026-04-30'),
          totalDepreciation: 0,
          assetCount: 0,
          journalEntryId: undefined,
          createdBy: undefined,
        },
      });
    });
  });

  describe('findByDate', () => {
    it('finds a run by the exact (organization, currency, asOfDate) key', async () => {
      const asOfDate = new Date('2026-04-30');

      await repository.findByDate('tenant-1', 'org-1', 'USD', asOfDate);

      expect(tx.glDepreciationRun.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', currency: 'USD', asOfDate },
      });
    });
  });

  describe('list', () => {
    it('lists depreciation runs scoped to the tenant and organization, newest first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.glDepreciationRun.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { asOfDate: 'desc' },
      });
    });
  });
});
