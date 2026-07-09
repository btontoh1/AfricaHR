import { Injectable } from '@nestjs/common';
import { Prisma, StatutoryRate, StatutoryRateCode } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateStatutoryRateInput {
  countryCode: string;
  code: StatutoryRateCode;
  rate: Prisma.Decimal | number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: string;
}

// Platform-root reference data — no tenantId, no RLS (see
// StatutoryTaxBandRepository for the same reasoning).
@Injectable()
export class StatutoryRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateStatutoryRateInput): Promise<StatutoryRate> {
    return this.prisma.statutoryRate.create({
      data: {
        countryCode: input.countryCode,
        code: input.code,
        rate: input.rate,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
        createdBy: input.createdBy,
      },
    });
  }

  listByCountry(countryCode: string): Promise<StatutoryRate[]> {
    return this.prisma.statutoryRate.findMany({
      where: { countryCode },
      orderBy: [{ code: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  findEffective(
    countryCode: string,
    code: StatutoryRateCode,
    asOf: Date,
  ): Promise<StatutoryRate | null> {
    return this.prisma.statutoryRate.findFirst({
      where: {
        countryCode,
        code,
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOf } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
