import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';
import { PlatformFinancialInputType } from '@prisma/client';

export interface PlatformFinancialInputRow {
  id: string;
  month: string;
  currency: string;
  amount: number;
  notes: string | null;
}

export interface SetFinancialInputInput {
  type: PlatformFinancialInputType;
  month: string;
  currency: string;
  amount: number;
  notes?: string;
  actorId?: string;
}

/**
 * ParotHR's own monthly acquisition cost or cash balance, entered by hand -
 * see PlatformFinancialInput's own schema comment for why this exists.
 * "platform_financial_inputs" has no tenantId and no RLS policy, same
 * posture as the tenants table itself - a plain unscoped query.
 */
@Injectable()
export class PlatformFinancialInputRepository {
  constructor(private readonly prisma: PrismaService) {}

  async set(input: SetFinancialInputInput): Promise<PlatformFinancialInputRow> {
    const row = await this.prisma.platformFinancialInput.upsert({
      where: { type_month_currency: { type: input.type, month: input.month, currency: input.currency } },
      create: {
        type: input.type,
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
    return { id: row.id, month: row.month, currency: row.currency, amount: Number(row.amount), notes: row.notes };
  }

  async list(type: PlatformFinancialInputType): Promise<PlatformFinancialInputRow[]> {
    const rows = await this.prisma.platformFinancialInput.findMany({
      where: { type },
      orderBy: [{ month: 'desc' }, { currency: 'asc' }],
    });
    return rows.map((row) => ({ id: row.id, month: row.month, currency: row.currency, amount: Number(row.amount), notes: row.notes }));
  }
}
