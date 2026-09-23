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
  let tx: { glJournalEntry: { create: jest.Mock; findMany: jest.Mock }; glJournalLine: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glJournalEntry: { create: jest.fn(), findMany: jest.fn() },
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
});
