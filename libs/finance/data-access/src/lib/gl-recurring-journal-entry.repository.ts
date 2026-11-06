import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type GlRecurringJournalEntryWithLines = Prisma.GlRecurringJournalEntryGetPayload<{
  include: { lines: { include: { account: true } } };
}>;

export interface CreateRecurringJournalEntryLineInput {
  accountId: string;
  debit: Prisma.Decimal | number;
  credit: Prisma.Decimal | number;
}

export interface CreateRecurringJournalEntryInput {
  organizationId: string;
  description: string;
  currency: string;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  lines: CreateRecurringJournalEntryLineInput[];
  createdBy?: string;
}

/** The minimal identifying shape find_due_recurring_journal_entries()
 * returns - see RecurringJournalEntryPoster, which re-reads the full
 * template through findById once it knows the tenant. */
export interface DueRecurringJournalEntry {
  id: string;
  tenantId: string;
}

interface RawDueRecurringJournalEntryRow {
  id: string;
  tenantId: string;
}

@Injectable()
export class GlRecurringJournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateRecurringJournalEntryInput): Promise<GlRecurringJournalEntryWithLines> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glRecurringJournalEntry.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          description: input.description,
          currency: input.currency,
          dayOfMonth: input.dayOfMonth,
          startDate: input.startDate,
          endDate: input.endDate,
          nextRunDate: input.nextRunDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
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
  }

  findById(tenantId: string, id: string): Promise<GlRecurringJournalEntryWithLines | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glRecurringJournalEntry.findFirst({
        where: { id, tenantId },
        include: { lines: { include: { account: true } } },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<GlRecurringJournalEntryWithLines[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glRecurringJournalEntry.findMany({
        where: { tenantId, organizationId },
        include: { lines: { include: { account: true } } },
        orderBy: { nextRunDate: 'asc' },
      }),
    );
  }

  /** Pause/resume only - FinanceService never lets amounts/lines be edited
   * in place once a template exists (see the model's own doc comment). */
  setActive(tenantId: string, id: string, isActive: boolean, updatedBy?: string): Promise<GlRecurringJournalEntryWithLines> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glRecurringJournalEntry.update({
        where: { id },
        data: { isActive, updatedBy },
        include: { lines: { include: { account: true } } },
      }),
    );
  }

  delete(tenantId: string, id: string): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.glRecurringJournalEntry.delete({ where: { id } });
    });
  }

  /** Called by RecurringJournalEntryPoster right after it successfully
   * posts (or safely no-ops on an already-posted) run - advances the
   * schedule and, once nextRunDate would fall past endDate, deactivates the
   * template instead of scheduling a run past it (see finance-domain's
   * isPastEndDate). */
  markRun(
    tenantId: string,
    id: string,
    update: { lastRunDate: Date; nextRunDate: Date; isActive: boolean },
  ): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.glRecurringJournalEntry.update({
        where: { id },
        data: {
          lastRunDate: update.lastRunDate,
          nextRunDate: update.nextRunDate,
          isActive: update.isActive,
        },
      });
    });
  }

  /**
   * Every active template whose nextRunDate has arrived, across every
   * tenant - RecurringJournalEntryPoster's daily sweep has no tenant
   * context to start from, same shape as
   * GlJournalEntryRepository's cross-tenant reconciliation reads. Backed by
   * a SECURITY DEFINER function (see RLS_CONVENTION.md §5) - returns only
   * (id, tenantId); the poster re-reads the full template through the
   * ordinary tenant-scoped findById once it knows which tenant it's
   * working with.
   */
  async listDue(asOf: Date): Promise<DueRecurringJournalEntry[]> {
    const rows = await this.prisma.$queryRaw<
      RawDueRecurringJournalEntryRow[]
    >`SELECT * FROM find_due_recurring_journal_entries(${asOf})`;
    return rows;
  }
}
