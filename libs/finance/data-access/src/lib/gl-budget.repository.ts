import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type GlBudgetWithAccount = Prisma.GlBudgetGetPayload<{ include: { account: true } }>;

export interface SetBudgetInput {
  organizationId: string;
  accountId: string;
  fiscalYear: number;
  currency: string;
  amount: Prisma.Decimal | number;
  updatedBy?: string;
}

@Injectable()
export class GlBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One row per (organization, account, fiscalYear, currency) - setting a
   * budget again for the same combination overwrites the amount in place,
   * same "overwrite, don't version" convention as GlPeriodCloseRepository.
   * upsert.
   */
  upsert(tenantId: string, input: SetBudgetInput): Promise<GlBudgetWithAccount> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glBudget.upsert({
        where: {
          tenantId_organizationId_accountId_fiscalYear_currency: {
            tenantId,
            organizationId: input.organizationId,
            accountId: input.accountId,
            fiscalYear: input.fiscalYear,
            currency: input.currency,
          },
        },
        create: {
          tenantId,
          organizationId: input.organizationId,
          accountId: input.accountId,
          fiscalYear: input.fiscalYear,
          currency: input.currency,
          amount: input.amount,
          createdBy: input.updatedBy,
          updatedBy: input.updatedBy,
        },
        update: {
          amount: input.amount,
          updatedBy: input.updatedBy,
        },
        include: { account: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<GlBudgetWithAccount | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glBudget.findFirst({ where: { id, tenantId }, include: { account: true } }),
    );
  }

  list(
    tenantId: string,
    query: { organizationId?: string; fiscalYear?: number },
  ): Promise<GlBudgetWithAccount[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glBudget.findMany({
        where: { tenantId, organizationId: query.organizationId, fiscalYear: query.fiscalYear },
        include: { account: true },
        orderBy: [{ fiscalYear: 'desc' }, { account: { code: 'asc' } }],
      }),
    );
  }

  delete(tenantId: string, id: string): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.glBudget.delete({ where: { id } });
    });
  }
}
