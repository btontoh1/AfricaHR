import { PrismaService } from '@africahr/platform-database';
import { ExpenseRepository } from './expense.repository';

describe('ExpenseRepository', () => {
  let repository: ExpenseRepository;
  let tx: { expense: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      expense: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new ExpenseRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates an expense row with the given fields', async () => {
      tx.expense.create.mockResolvedValue({ id: 'expense-1' });
      const expenseDate = new Date('2026-04-01');

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        description: 'Fuel',
        category: 'TRAVEL',
        currency: 'GHS',
        amount: 200,
        expenseDate,
        paidBy: 'COMPANY',
        notes: 'Site visit',
        createdBy: 'user-1',
      });

      expect(tx.expense.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          description: 'Fuel',
          category: 'TRAVEL',
          currency: 'GHS',
          amount: 200,
          expenseDate,
          paidBy: 'COMPANY',
          notes: 'Site visit',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
    });
  });

  describe('findById', () => {
    it('finds an expense scoped to the tenant', async () => {
      await repository.findById('tenant-1', 'expense-1');

      expect(tx.expense.findFirst).toHaveBeenCalledWith({ where: { id: 'expense-1', tenantId: 'tenant-1' } });
    });
  });

  describe('list', () => {
    it('lists expenses scoped to the tenant and organization, newest first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.expense.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
        orderBy: { expenseDate: 'desc' },
      });
    });
  });

  describe('markReimbursed', () => {
    it('sets reimbursedAt', async () => {
      const reimbursedAt = new Date('2026-04-05');

      await repository.markReimbursed('tenant-1', 'expense-1', reimbursedAt, 'user-1');

      expect(tx.expense.update).toHaveBeenCalledWith({
        where: { id: 'expense-1' },
        data: { reimbursedAt, updatedBy: 'user-1' },
      });
    });
  });
});
