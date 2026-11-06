import { Injectable } from '@nestjs/common';
import { GlHomeCurrency } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

@Injectable()
export class GlHomeCurrencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One row per organization - setting it again overwrites the currency in
   * place, same "overwrite, don't version" convention as
   * GlPeriodCloseRepository.upsert. */
  upsert(tenantId: string, organizationId: string, currency: string, updatedBy?: string): Promise<GlHomeCurrency> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glHomeCurrency.upsert({
        where: { organizationId },
        create: { tenantId, organizationId, currency, updatedBy },
        update: { currency, updatedBy },
      }),
    );
  }

  findByOrganization(tenantId: string, organizationId: string): Promise<GlHomeCurrency | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glHomeCurrency.findFirst({ where: { tenantId, organizationId } }),
    );
  }
}
