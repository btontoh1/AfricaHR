import { PrismaService } from '@africahr/platform-database';
import { GlFxRevaluationRepository } from './gl-fx-revaluation.repository';

describe('GlFxRevaluationRepository', () => {
  let repository: GlFxRevaluationRepository;
  let tx: { glFxRevaluation: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      glFxRevaluation: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlFxRevaluationRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a revaluation row with the given fields', async () => {
      tx.glFxRevaluation.create.mockResolvedValue({ id: 'rev-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: 11,
        previousRate: 10,
        gainLoss: 500,
        journalEntryId: 'entry-1',
        createdBy: 'user-1',
      });

      expect(tx.glFxRevaluation.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'USD',
          asOfDate: new Date('2026-03-31'),
          rate: 11,
          previousRate: 10,
          gainLoss: 500,
          journalEntryId: 'entry-1',
          createdBy: 'user-1',
        },
      });
    });

    it('omits previousRate/gainLoss/journalEntryId when not given (first revaluation)', async () => {
      tx.glFxRevaluation.create.mockResolvedValue({ id: 'rev-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: 10,
      });

      expect(tx.glFxRevaluation.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'USD',
          asOfDate: new Date('2026-03-31'),
          rate: 10,
          previousRate: undefined,
          gainLoss: undefined,
          journalEntryId: undefined,
          createdBy: undefined,
        },
      });
    });
  });

  describe('findLatest', () => {
    it('finds the most recent revaluation for the organization/currency', async () => {
      await repository.findLatest('tenant-1', 'org-1', 'USD');

      expect(tx.glFxRevaluation.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', currency: 'USD' },
        orderBy: { asOfDate: 'desc' },
      });
    });
  });

  describe('list', () => {
    it('lists revaluations scoped to the tenant and organization, newest first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.glFxRevaluation.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { asOfDate: 'desc' },
      });
    });
  });
});
