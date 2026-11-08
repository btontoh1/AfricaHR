import { PrismaService } from '@africahr/platform-database';
import { GlCostCenterRepository } from './gl-cost-center.repository';

describe('GlCostCenterRepository', () => {
  let repository: GlCostCenterRepository;
  let tx: { glCostCenter: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glCostCenter: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlCostCenterRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a cost center scoped to the tenant and organization', async () => {
      tx.glCostCenter.create.mockResolvedValue({ id: 'cc-1' });

      const result = await repository.create('tenant-1', {
        organizationId: 'org-1',
        name: 'Head Office',
        code: 'HO',
        createdBy: 'user-1',
      });

      expect(tx.glCostCenter.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          name: 'Head Office',
          code: 'HO',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
      expect(result).toEqual({ id: 'cc-1' });
    });
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant', async () => {
      await repository.findById('tenant-1', 'cc-1');

      expect(tx.glCostCenter.findFirst).toHaveBeenCalledWith({ where: { id: 'cc-1', tenantId: 'tenant-1' } });
    });
  });

  describe('list', () => {
    it('scopes to tenant and optional organization, ordered by name', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.glCostCenter.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { name: 'asc' },
      });
    });
  });
});
