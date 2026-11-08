import { PrismaService } from '@africahr/platform-database';
import { GlRecurringJournalEntryRepository } from './gl-recurring-journal-entry.repository';

describe('GlRecurringJournalEntryRepository', () => {
  let repository: GlRecurringJournalEntryRepository;
  let tx: {
    glRecurringJournalEntry: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock; $queryRaw: jest.Mock };

  beforeEach(() => {
    tx = {
      glRecurringJournalEntry: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)), $queryRaw: jest.fn() };
    repository = new GlRecurringJournalEntryRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates the template with its lines in one nested write', async () => {
      tx.glRecurringJournalEntry.create.mockResolvedValue({ id: 'rec-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        description: 'Monthly rent',
        currency: 'GHS',
        dayOfMonth: 5,
        startDate: new Date('2026-04-01'),
        nextRunDate: new Date('2026-04-05'),
        createdBy: 'user-1',
        lines: [
          { accountId: 'acc-rent', debit: 500, credit: 0 },
          { accountId: 'acc-cash', debit: 0, credit: 500 },
        ],
      });

      expect(tx.glRecurringJournalEntry.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          description: 'Monthly rent',
          currency: 'GHS',
          dayOfMonth: 5,
          startDate: new Date('2026-04-01'),
          endDate: undefined,
          nextRunDate: new Date('2026-04-05'),
          createdBy: 'user-1',
          updatedBy: 'user-1',
          lines: {
            create: [
              { tenantId: 'tenant-1', accountId: 'acc-rent', debit: 500, credit: 0 },
              { tenantId: 'tenant-1', accountId: 'acc-cash', debit: 0, credit: 500 },
            ],
          },
        },
        include: { lines: { include: { account: true } } },
      });
    });
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant and includes lines with accounts', async () => {
      await repository.findById('tenant-1', 'rec-1');

      expect(tx.glRecurringJournalEntry.findFirst).toHaveBeenCalledWith({
        where: { id: 'rec-1', tenantId: 'tenant-1' },
        include: { lines: { include: { account: true } } },
      });
    });
  });

  describe('list', () => {
    it('filters by organization, ordered by next run date', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.glRecurringJournalEntry.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        include: { lines: { include: { account: true } } },
        orderBy: { nextRunDate: 'asc' },
      });
    });
  });

  describe('setActive', () => {
    it('updates isActive and updatedBy', async () => {
      await repository.setActive('tenant-1', 'rec-1', false, 'user-1');

      expect(tx.glRecurringJournalEntry.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { isActive: false, updatedBy: 'user-1' },
        include: { lines: { include: { account: true } } },
      });
    });
  });

  describe('delete', () => {
    it('deletes the template by id', async () => {
      await repository.delete('tenant-1', 'rec-1');

      expect(tx.glRecurringJournalEntry.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
    });
  });

  describe('markRun', () => {
    it('advances lastRunDate/nextRunDate and sets isActive', async () => {
      await repository.markRun('tenant-1', 'rec-1', {
        lastRunDate: new Date('2026-04-05'),
        nextRunDate: new Date('2026-05-05'),
        isActive: true,
      });

      expect(tx.glRecurringJournalEntry.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          lastRunDate: new Date('2026-04-05'),
          nextRunDate: new Date('2026-05-05'),
          isActive: true,
        },
      });
    });
  });

  describe('listDue', () => {
    it('calls the cross-tenant SECURITY DEFINER function and returns its rows', async () => {
      const asOf = new Date('2026-04-05');
      prisma.$queryRaw.mockResolvedValue([{ id: 'rec-1', tenantId: 'tenant-1' }]);

      const result = await repository.listDue(asOf);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'rec-1', tenantId: 'tenant-1' }]);
    });
  });
});
