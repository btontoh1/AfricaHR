import { Injectable } from '@nestjs/common';
import { GlDepreciationRun, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateDepreciationRunInput {
  organizationId: string;
  currency: string;
  asOfDate: Date;
  totalDepreciation: Prisma.Decimal | number;
  assetCount: number;
  journalEntryId?: string | null;
  createdBy?: string;
}

@Injectable()
export class GlDepreciationRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateDepreciationRunInput): Promise<GlDepreciationRun> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glDepreciationRun.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          currency: input.currency,
          asOfDate: input.asOfDate,
          totalDepreciation: input.totalDepreciation,
          assetCount: input.assetCount,
          journalEntryId: input.journalEntryId ?? undefined,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  /** Idempotency check for runDepreciation - the (organizationId, currency,
   * asOfDate) unique constraint is the concurrency backstop, this is the
   * up-front check for a clear error message, same pattern as
   * GlFxRevaluationRepository.findLatest. */
  findByDate(tenantId: string, organizationId: string, currency: string, asOfDate: Date): Promise<GlDepreciationRun | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glDepreciationRun.findFirst({
        where: { tenantId, organizationId, currency, asOfDate },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<GlDepreciationRun[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glDepreciationRun.findMany({
        where: { tenantId, organizationId },
        orderBy: { asOfDate: 'desc' },
      }),
    );
  }
}
