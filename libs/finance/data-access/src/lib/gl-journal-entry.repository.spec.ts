import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
    code,
    message: 'mock',
  });
}

describe('GlJournalEntryRepository', () => {
  let repository: GlJournalEntryRepository;
  let tx: {
    glJournalEntry: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    glJournalLine: { findMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glJournalEntry: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      glJournalLine: { findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlJournalEntryRepository(prisma as unknown as PrismaService);
  });

  describe('createIfNotExists', () => {
    const input = {
      organizationId: 'org-1',
      entryDate: new Date('2026-01-31'),
      description: 'Pay run disbursed',
      currency: 'GHS',
      sourceType: 'PAY_RUN_DISBURSED' as const,
      sourceId: 'payrun-1',
      lines: [{ accountId: 'acc-1', debit: 100, credit: 0 }],
    };

    it('creates the entry with its lines in one nested write', async () => {
      tx.glJournalEntry.create.mockResolvedValue({ id: 'entry-1' });

      const result = await repository.createIfNotExists('tenant-1', input);

      expect(result).toEqual({ id: 'entry-1' });
      expect(tx.glJournalEntry.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          entryDate: input.entryDate,
          description: 'Pay run disbursed',
          currency: 'GHS',
          sourceType: 'PAY_RUN_DISBURSED',
          sourceId: 'payrun-1',
          createdBy: undefined,
          reversalOfId: undefined,
          lines: { create: [{ tenantId: 'tenant-1', accountId: 'acc-1', debit: 100, credit: 0 }] },
        },
        include: { lines: { include: { account: true } } },
      });
    });

    it('returns null instead of throwing when the source event was already posted (P2002)', async () => {
      tx.glJournalEntry.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await repository.createIfNotExists('tenant-1', input);

      expect(result).toBeNull();
    });

    it('rethrows any other database error', async () => {
      tx.glJournalEntry.create.mockRejectedValue(knownRequestError('P2003'));

      await expect(repository.createIfNotExists('tenant-1', input)).rejects.toBeDefined();
    });
  });

  describe('listLinesInRange', () => {
    it('filters by tenant, organization, and entry date range', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');

      await repository.listLinesInRange('tenant-1', { organizationId: 'org-1', from, to });

      expect(tx.glJournalLine.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          journalEntry: { organizationId: 'org-1', entryDate: { gte: from, lte: to } },
        },
        include: { account: true, journalEntry: { select: { currency: true } } },
      });
    });
  });

  describe('listLinesUpTo', () => {
    it('filters by tenant, organization, and entry date up to asOf, with no lower bound', async () => {
      const asOf = new Date('2026-01-31');

      await repository.listLinesUpTo('tenant-1', { organizationId: 'org-1', asOf });

      expect(tx.glJournalLine.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          journalEntry: { organizationId: 'org-1', entryDate: { lte: asOf } },
        },
        include: { account: true, journalEntry: { select: { currency: true } } },
      });
    });
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant', async () => {
      tx.glJournalEntry.findFirst.mockResolvedValue({ id: 'entry-1' });

      const result = await repository.findById('tenant-1', 'entry-1');

      expect(tx.glJournalEntry.findFirst).toHaveBeenCalledWith({
        where: { id: 'entry-1', tenantId: 'tenant-1' },
        include: { lines: { include: { account: true } } },
      });
      expect(result).toEqual({ id: 'entry-1' });
    });
  });

  describe('voidEntry', () => {
    const reversal = {
      organizationId: 'org-1',
      entryDate: new Date('2026-02-01'),
      description: 'Void: Office rent',
      currency: 'GHS',
      sourceType: 'MANUAL' as const,
      sourceId: 'reversal-uuid',
      createdBy: 'user-1',
      lines: [{ accountId: 'acc-cash', debit: 500, credit: 0 }],
    };

    it('creates the reversal and marks the original voided in one transaction', async () => {
      tx.glJournalEntry.create.mockResolvedValue({ id: 'reversal-1' });

      const result = await repository.voidEntry('tenant-1', 'original-1', reversal);

      expect(tx.glJournalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          reversalOfId: 'original-1',
          sourceId: 'reversal-uuid',
        }),
        include: { lines: { include: { account: true } } },
      });
      expect(tx.glJournalEntry.update).toHaveBeenCalledWith({
        where: { id: 'original-1' },
        data: { voidedAt: expect.any(Date), voidedBy: 'user-1' },
      });
      expect(result).toEqual({ id: 'reversal-1' });
    });

    it('returns null instead of throwing when the original was already voided concurrently (P2002)', async () => {
      tx.glJournalEntry.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await repository.voidEntry('tenant-1', 'original-1', reversal);

      expect(result).toBeNull();
      expect(tx.glJournalEntry.update).not.toHaveBeenCalled();
    });
  });
});
