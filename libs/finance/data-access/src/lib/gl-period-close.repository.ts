import { Injectable } from '@nestjs/common';
import { GlPeriodClose } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

@Injectable()
export class GlPeriodCloseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrganization(tenantId: string, organizationId: string): Promise<GlPeriodClose | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glPeriodClose.findFirst({ where: { tenantId, organizationId } }),
    );
  }

  /**
   * One row per organization (schema's @@unique organizationId) - closing
   * again just overwrites closedThrough/closedAt/closedBy in place, there's
   * no history of past closes kept. FinanceService.setPeriodClose is what
   * enforces the date can only move forward; this just persists whatever
   * it's given.
   */
  upsert(
    tenantId: string,
    organizationId: string,
    closedThrough: Date,
    closedBy?: string,
  ): Promise<GlPeriodClose> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glPeriodClose.upsert({
        where: { organizationId },
        create: { tenantId, organizationId, closedThrough, closedBy },
        update: { closedThrough, closedBy },
      }),
    );
  }
}
