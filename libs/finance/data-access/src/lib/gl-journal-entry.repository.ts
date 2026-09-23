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
  /** Only set when this entry is itself a reversal - see voidEntry below. */
  reversalOfId?: string;
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
            reversalOfId: input.reversalOfId,
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

  findById(tenantId: string, id: string): Promise<GlJournalEntryWithLines | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glJournalEntry.findFirst({
        where: { id, tenantId },
        include: { lines: { include: { account: true } } },
      }),
    );
  }

  /**
   * Atomically creates the reversing entry and marks the original as
   * voided - both succeed or both fail in the same transaction, so a void
   * can never leave the ledger with a reversal but no voidedAt, or vice
   * versa. Returns null instead of throwing if the original was already
   * voided concurrently (reversalOfId's unique constraint is the
   * database-level backstop - see FinanceService.voidEntry for the
   * business-rule checks that normally catch this first).
   */
  async voidEntry(
    tenantId: string,
    originalId: string,
    reversal: CreateJournalEntryInput,
  ): Promise<GlJournalEntryWithLines | null> {
    try {
      return await this.prisma.withTenantContext(tenantId, async (tx) => {
        const reversalEntry = await tx.glJournalEntry.create({
          data: {
            tenantId,
            organizationId: reversal.organizationId,
            entryDate: reversal.entryDate,
            description: reversal.description,
            currency: reversal.currency,
            sourceType: reversal.sourceType,
            sourceId: reversal.sourceId,
            reversalOfId: originalId,
            createdBy: reversal.createdBy,
            lines: {
              create: reversal.lines.map((line) => ({
                tenantId,
                accountId: line.accountId,
                debit: line.debit,
                credit: line.credit,
              })),
            },
          },
          include: { lines: { include: { account: true } } },
        });
        await tx.glJournalEntry.update({
          where: { id: originalId },
          data: { voidedAt: new Date(), voidedBy: reversal.createdBy },
        });
        return reversalEntry;
      });
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
