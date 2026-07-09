import { Injectable } from '@nestjs/common';
import { Prisma, StatutoryTaxBand } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateStatutoryTaxBandInput {
  countryCode: string;
  order: number;
  lowerBound: Prisma.Decimal | number;
  upperBound?: Prisma.Decimal | number | null;
  rate: Prisma.Decimal | number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: string;
}

// Platform-root reference data — no tenantId, no RLS, so this queries
// PrismaService directly rather than through withTenantContext (same as
// TenantRepository for the analogous "Tenant" exemption).
@Injectable()
export class StatutoryTaxBandRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateStatutoryTaxBandInput): Promise<StatutoryTaxBand> {
    return this.prisma.statutoryTaxBand.create({
      data: {
        countryCode: input.countryCode,
        order: input.order,
        lowerBound: input.lowerBound,
        upperBound: input.upperBound,
        rate: input.rate,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
        createdBy: input.createdBy,
      },
    });
  }

  listByCountry(countryCode: string): Promise<StatutoryTaxBand[]> {
    return this.prisma.statutoryTaxBand.findMany({
      where: { countryCode },
      orderBy: [{ effectiveFrom: 'desc' }, { order: 'asc' }],
    });
  }

  /** Bands in effect for `countryCode` as of `asOf`, ascending by band order. */
  findEffective(countryCode: string, asOf: Date): Promise<StatutoryTaxBand[]> {
    return this.prisma.statutoryTaxBand.findMany({
      where: {
        countryCode,
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOf } }],
      },
      orderBy: { order: 'asc' },
    });
  }
}
