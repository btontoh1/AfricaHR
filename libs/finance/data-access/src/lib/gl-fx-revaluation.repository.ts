import { Injectable } from '@nestjs/common';
import { GlFxRevaluation, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateFxRevaluationInput {
  organizationId: string;
  currency: string;
  asOfDate: Date;
  rate: Prisma.Decimal | number;
  previousRate?: Prisma.Decimal | number | null;
  gainLoss?: Prisma.Decimal | number | null;
  journalEntryId?: string | null;
  createdBy?: string;
}

@Injectable()
export class GlFxRevaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateFxRevaluationInput): Promise<GlFxRevaluation> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFxRevaluation.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          currency: input.currency,
          asOfDate: input.asOfDate,
          rate: input.rate,
          previousRate: input.previousRate ?? undefined,
          gainLoss: input.gainLoss ?? undefined,
          journalEntryId: input.journalEntryId ?? undefined,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  /** The most recent revaluation run for this organization/currency, if
   * any - its rate becomes the next run's previousRate baseline (see
   * FinanceService.runFxRevaluation). */
  findLatest(tenantId: string, organizationId: string, currency: string): Promise<GlFxRevaluation | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFxRevaluation.findFirst({
        where: { tenantId, organizationId, currency },
        orderBy: { asOfDate: 'desc' },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<GlFxRevaluation[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFxRevaluation.findMany({
        where: { tenantId, organizationId },
        orderBy: { asOfDate: 'desc' },
      }),
    );
  }
}
