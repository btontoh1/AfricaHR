import { Injectable } from '@nestjs/common';
import { GlJournalEntrySourceType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type GlJournalEntryWithLines = Prisma.GlJournalEntryGetPayload<{
  include: { lines: { include: { account: true } } };
}>;

export type GlJournalLineWithAccount = Prisma.GlJournalLineGetPayload<{
  include: { account: true; journalEntry: { select: { currency: true } } };
}>;

export interface CreateJournalEntryLineInput {
  accountId: string;
  debit: Prisma.Decimal | number;
  credit: Prisma.Decimal | number;
}

export interface CreateJournalEntryInput {
  organizationId: string;
  entryDate: Date;
  description: string;
  currency: string;
  sourceType: GlJournalEntrySourceType;
  sourceId: string;
  createdBy?: string;
  lines: CreateJournalEntryLineInput[];
}

@Injectable()
export class GlJournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns null instead of throwing when an entry for this exact
   * (sourceType, sourceId) already exists - the unique constraint on those
   * two columns is the actual idempotency guard, enforced at the database
   * level so it holds even under concurrent event delivery; this just turns
   * that constraint violation into a quiet no-op rather than a 500 for the
   * (already-defended-elsewhere) case of an event firing twice.
   */
  async createIfNotExists(
    tenantId: string,
    input: CreateJournalEntryInput,
  ): Promise<GlJournalEntryWithLines | null> {
    try {
      return await this.prisma.withTenantContext(tenantId, (tx) =>
        tx.glJournalEntry.create({
          data: {
            tenantId,
            organizationId: input.organizationId,
            entryDate: input.entryDate,
            description: input.description,
            currency: input.currency,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            createdBy: input.createdBy,
            lines: {
              create: input.lines.map((line) => ({
                tenantId,
                accountId: line.accountId,
                debit: line.debit,
                credit: line.credit,
              })),
            },
          },
          include: { lines: { include: { account: true } } },
        }),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  list(tenantId: string, organizationId?: string): Promise<GlJournalEntryWithLines[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glJournalEntry.findMany({
        where: { tenantId, organizationId },
        include: { lines: { include: { account: true } } },
        orderBy: { entryDate: 'desc' },
      }),
    );
  }

  /**
   * Every journal line whose entry falls within [from, to] (inclusive),
   * account included - the raw material FinanceReportsService aggregates
   * into a P&L/cash-flow report. Deliberately unfiltered by account type;
   * the report layer decides which lines matter for which report.
   */
  listLinesInRange(
    tenantId: string,
    range: { organizationId?: string; from: Date; to: Date },
  ): Promise<GlJournalLineWithAccount[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glJournalLine.findMany({
        where: {
          tenantId,
          journalEntry: {
            organizationId: range.organizationId,
            entryDate: { gte: range.from, lte: range.to },
          },
        },
        include: { account: true, journalEntry: { select: { currency: true } } },
      }),
    );
  }
}
