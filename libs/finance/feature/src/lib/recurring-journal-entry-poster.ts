import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  DueRecurringJournalEntry,
  GlJournalEntryRepository,
  GlRecurringJournalEntryRepository,
} from '@africahr/finance-data-access';
import { computeNextRunDate, isPastEndDate } from '@africahr/finance-domain';

/**
 * Posts a real GlJournalEntry from every GlRecurringJournalEntry template
 * that's come due, once a day, with no person clicking anything - same
 * "cross-tenant cron sweep, then per-item tenant-scoped work" shape as
 * PayrollTransferWebhookListener.reconcileStalePendingDisbursements. Runs
 * daily rather than tied to any particular time of day, since entryDate is
 * always the template's own scheduled nextRunDate, not "now" - a sweep
 * that's a day or two late from a redeploy still posts with the correct
 * date.
 */
@Injectable()
export class RecurringJournalEntryPoster {
  private readonly logger = new Logger(RecurringJournalEntryPoster.name);

  constructor(
    private readonly recurringEntries: GlRecurringJournalEntryRepository,
    private readonly journalEntries: GlJournalEntryRepository,
  ) {}

  @Cron('0 1 * * *')
  async postDueRecurringJournalEntries(): Promise<void> {
    let due: DueRecurringJournalEntry[];
    try {
      due = await this.recurringEntries.listDue(new Date());
    } catch (error) {
      this.logger.error('Failed to list due recurring journal entries', error as Error);
      return;
    }

    for (const item of due) {
      try {
        await this.postOne(item.tenantId, item.id);
      } catch (error) {
        this.logger.error(`Failed to post recurring journal entry "${item.id}"`, error as Error);
      }
    }
  }

  /**
   * Re-reads the template fresh (rather than trusting the cross-tenant
   * listing's minimal shape) so a template paused or deleted between the
   * listing and this item's turn is simply skipped. Posts via
   * createIfNotExists with sourceId "<templateId>:<scheduledRunDate>", so a
   * sweep that runs twice for the same date (a restart mid-sweep, say) is a
   * safe no-op at the database level - see GlJournalEntrySourceType.
   * RECURRING_JOURNAL_ENTRY's own doc comment. Advances the schedule
   * regardless of whether this run actually created a new entry or found
   * one already there, so a crash between posting and advancing never
   * wedges the template on the same date forever.
   */
  private async postOne(tenantId: string, id: string): Promise<void> {
    const template = await this.recurringEntries.findById(tenantId, id);
    if (!template || !template.isActive) {
      return;
    }

    const runDate = template.nextRunDate;
    await this.journalEntries.createIfNotExists(tenantId, {
      organizationId: template.organizationId,
      entryDate: runDate,
      description: template.description,
      currency: template.currency,
      sourceType: 'RECURRING_JOURNAL_ENTRY',
      sourceId: `${template.id}:${runDate.toISOString().slice(0, 10)}`,
      lines: template.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
      })),
    });

    const next = computeNextRunDate(runDate, template.dayOfMonth);
    await this.recurringEntries.markRun(tenantId, id, {
      lastRunDate: runDate,
      nextRunDate: next,
      isActive: !isPastEndDate(next, template.endDate),
    });
  }
}
