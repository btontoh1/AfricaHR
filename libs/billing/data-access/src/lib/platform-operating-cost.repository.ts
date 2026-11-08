import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface PlatformOperatingCostRow {
  id: string;
  month: string;
  currency: string;
  amount: number;
  notes: string | null;
}

export interface SetOperatingCostInput {
  month: string;
  currency: string;
  amount: number;
  notes?: string;
  actorId?: string;
}

/**
 * ParotHR's own monthly operating cost, entered by hand - see
 * PlatformOperatingCost's own schema comment for why this exists at all.
 * "platform_operating_costs" has no tenantId and no RLS policy, same
 * posture as the tenants table itself - a plain unscoped query.
 */
@Injectable()
export class PlatformOperatingCostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async set(input: SetOperatingCostInput): Promise<PlatformOperatingCostRow> {
    const row = await this.prisma.platformOperatingCost.upsert({
      where: { month_currency: { month: input.month, currency: input.currency } },
      create: {
        month: input.month,
        currency: input.currency,
        amount: input.amount,
        notes: input.notes,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      },
      update: {
        amount: input.amount,
        notes: input.notes,
        updatedBy: input.actorId,
      },
    });
    return { ...row, amount: Number(row.amount) };
  }

  async list(): Promise<PlatformOperatingCostRow[]> {
    const rows = await this.prisma.platformOperatingCost.findMany({
      orderBy: [{ month: 'desc' }, { currency: 'asc' }],
    });
    return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
  }
}
