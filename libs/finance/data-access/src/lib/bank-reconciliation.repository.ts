import { Injectable } from '@nestjs/common';
import { BankReconciliation, BankReconciliationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateBankReconciliationInput {
  organizationId: string;
  currency: string;
  statementDate: Date;
  statementEndingBalance: Prisma.Decimal | number;
  createdBy?: string;
}

@Injectable()
export class BankReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateBankReconciliationInput): Promise<BankReconciliation> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.bankReconciliation.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          currency: input.currency,
          statementDate: input.statementDate,
          statementEndingBalance: input.statementEndingBalance,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<BankReconciliation | null> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.bankReconciliation.findFirst({ where: { id, tenantId } }));
  }

  list(tenantId: string, organizationId?: string): Promise<BankReconciliation[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.bankReconciliation.findMany({
        where: { tenantId, organizationId },
        orderBy: { statementDate: 'desc' },
      }),
    );
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: BankReconciliationStatus,
    extra: { completedAt?: Date; updatedBy?: string },
  ): Promise<BankReconciliation> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.bankReconciliation.update({
        where: { id },
        data: { status, completedAt: extra.completedAt, updatedBy: extra.updatedBy },
      }),
    );
  }

  delete(tenantId: string, id: string): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.bankReconciliation.delete({ where: { id } });
    });
  }
}
