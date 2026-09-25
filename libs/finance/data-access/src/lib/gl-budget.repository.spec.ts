import { PrismaService } from '@africahr/platform-database';
import { GlBudgetRepository } from './gl-budget.repository';

describe('GlBudgetRepository', () => {
  let repository: GlBudgetRepository;
  let tx: { glBudget: { upsert: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; delete: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glBudget: { upsert: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlBudgetRepository(prisma as unknown as PrismaService);
  });

  describe('upsert', () => {
    it('creates or updates the row keyed by (organization, account, fiscalYear, currency)', async () => {
      tx.glBudget.upsert.mockResolvedValue({ id: 'budget-1' });

      await repository.upsert('tenant-1', {
        organizationId: 'org-1',
        accountId: 'acc-1',
        fiscalYear: 2026,
        currency: 'GHS',
        amount: 1000,
        updatedBy: 'user-1',
      });

      expect(tx.glBudget.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_organizationId_accountId_fiscalYear_currency: {
            tenantId: 'tenant-1',
            organizationId: 'org-1',
            accountId: 'acc-1',
            fiscalYear: 2026,
            currency: 'GHS',
          },
        },
        create: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          accountId: 'acc-1',
          fiscalYear: 2026,
          currency: 'GHS',
          amount: 1000,
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
        update: { amount: 1000, updatedBy: 'user-1' },
        include: { account: true },
      });
    });
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant and includes the account', async () => {
      await repository.findById('tenant-1', 'budget-1');

      expect(tx.glBudget.findFirst).toHaveBeenCalledWith({
        where: { id: 'budget-1', tenantId: 'tenant-1' },
        include: { account: true },
      });
    });
  });

  describe('list', () => {
    it('filters by organization and fiscal year, ordered by year then account code', async () => {
      await repository.list('tenant-1', { organizationId: 'org-1', fiscalYear: 2026 });

      expect(tx.glBudget.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', fiscalYear: 2026 },
        include: { account: true },
        orderBy: [{ fiscalYear: 'desc' }, { account: { code: 'asc' } }],
      });
    });
  });

  describe('delete', () => {
    it('deletes the row by id', async () => {
      await repository.delete('tenant-1', 'budget-1');

      expect(tx.glBudget.delete).toHaveBeenCalledWith({ where: { id: 'budget-1' } });
    });
  });
});
