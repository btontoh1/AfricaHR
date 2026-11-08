import { PrismaService } from '@africahr/platform-database';
import { BankReconciliationRepository } from './bank-reconciliation.repository';

describe('BankReconciliationRepository', () => {
  let repository: BankReconciliationRepository;
  let tx: {
    bankReconciliation: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      bankReconciliation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new BankReconciliationRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a reconciliation scoped to the tenant and organization', async () => {
      const statementDate = new Date('2026-01-31');

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate,
        statementEndingBalance: 5000,
        createdBy: 'user-1',
      });

      expect(tx.bankReconciliation.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          currency: 'GHS',
          statementDate,
          statementEndingBalance: 5000,
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
    });
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant', async () => {
      await repository.findById('tenant-1', 'rec-1');

      expect(tx.bankReconciliation.findFirst).toHaveBeenCalledWith({ where: { id: 'rec-1', tenantId: 'tenant-1' } });
    });
  });

  describe('list', () => {
    it('lists reconciliations scoped to the tenant and organization, most recent statement date first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.bankReconciliation.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { statementDate: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('sets completedAt when transitioning to COMPLETED', async () => {
      const completedAt = new Date('2026-02-01');

      await repository.updateStatus('tenant-1', 'rec-1', 'COMPLETED', { completedAt, updatedBy: 'user-1' });

      expect(tx.bankReconciliation.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { status: 'COMPLETED', completedAt, updatedBy: 'user-1' },
      });
    });
  });

  describe('delete', () => {
    it('deletes the reconciliation by id', async () => {
      await repository.delete('tenant-1', 'rec-1');

      expect(tx.bankReconciliation.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
    });
  });
});
