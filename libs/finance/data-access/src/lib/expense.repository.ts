import { Injectable } from '@nestjs/common';
import { Expense, ExpenseCategory, ExpensePaidBy, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateExpenseInput {
  organizationId: string;
  description: string;
  category: ExpenseCategory;
  currency: string;
  amount: Prisma.Decimal | number;
  expenseDate: Date;
  paidBy: ExpensePaidBy;
  notes?: string;
  createdBy?: string;
}

@Injectable()
export class ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateExpenseInput): Promise<Expense> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.expense.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          description: input.description,
          category: input.category,
          currency: input.currency,
          amount: input.amount,
          expenseDate: input.expenseDate,
          paidBy: input.paidBy,
          notes: input.notes,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Expense | null> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.expense.findFirst({ where: { id, tenantId } }));
  }

  list(tenantId: string, organizationId?: string): Promise<Expense[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.expense.findMany({
        where: { tenantId, organizationId },
        orderBy: { expenseDate: 'desc' },
      }),
    );
  }

  /** Only ever called for an EMPLOYEE-paid expense whose reimbursedAt is
   * still null - see FinanceService.markExpenseReimbursed. */
  markReimbursed(tenantId: string, id: string, reimbursedAt: Date, updatedBy?: string): Promise<Expense> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.expense.update({
        where: { id },
        data: { reimbursedAt, updatedBy },
      }),
    );
  }
}
