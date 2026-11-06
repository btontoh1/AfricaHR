import { GlJournalEntryRepository, GlRecurringJournalEntryRepository } from '@africahr/finance-data-access';
import { RecurringJournalEntryPoster } from './recurring-journal-entry-poster';

describe('RecurringJournalEntryPoster', () => {
  let poster: RecurringJournalEntryPoster;
  let recurringEntries: jest.Mocked<GlRecurringJournalEntryRepository>;
  let journalEntries: jest.Mocked<GlJournalEntryRepository>;

  function makeTemplate(overrides: Record<string, unknown> = {}) {
    return {
      id: 'rec-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      description: 'Monthly rent',
      currency: 'GHS',
      dayOfMonth: 5,
      nextRunDate: new Date('2026-04-05'),
      endDate: null,
      isActive: true,
      lines: [
        { accountId: 'acc-rent', debit: 500, credit: 0 },
        { accountId: 'acc-cash', debit: 0, credit: 500 },
      ],
      ...overrides,
    };
  }

  beforeEach(() => {
    recurringEntries = {
      listDue: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      markRun: jest.fn(),
    } as unknown as jest.Mocked<GlRecurringJournalEntryRepository>;
    journalEntries = {
      createIfNotExists: jest.fn().mockResolvedValue({ id: 'entry-1' }),
    } as unknown as jest.Mocked<GlJournalEntryRepository>;

    poster = new RecurringJournalEntryPoster(recurringEntries, journalEntries);
  });

  it('does nothing when no templates are due', async () => {
    await poster.postDueRecurringJournalEntries();

    expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
  });

  it('logs and returns without posting anything if listing due templates fails', async () => {
    recurringEntries.listDue.mockRejectedValue(new Error('db down'));

    await expect(poster.postDueRecurringJournalEntries()).resolves.toBeUndefined();
    expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
  });

  it('posts a due template and advances its schedule by one month', async () => {
    recurringEntries.listDue.mockResolvedValue([{ id: 'rec-1', tenantId: 'tenant-1' }]);
    recurringEntries.findById.mockResolvedValue(makeTemplate() as never);

    await poster.postDueRecurringJournalEntries();

    expect(journalEntries.createIfNotExists).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      entryDate: new Date('2026-04-05'),
      description: 'Monthly rent',
      currency: 'GHS',
      sourceType: 'RECURRING_JOURNAL_ENTRY',
      sourceId: 'rec-1:2026-04-05',
      lines: [
        { accountId: 'acc-rent', debit: 500, credit: 0 },
        { accountId: 'acc-cash', debit: 0, credit: 500 },
      ],
    });
    expect(recurringEntries.markRun).toHaveBeenCalledWith('tenant-1', 'rec-1', {
      lastRunDate: new Date('2026-04-05'),
      nextRunDate: new Date('2026-05-05'),
      isActive: true,
    });
  });

  it('deactivates the template once the next run would fall past its end date', async () => {
    recurringEntries.listDue.mockResolvedValue([{ id: 'rec-1', tenantId: 'tenant-1' }]);
    recurringEntries.findById.mockResolvedValue(
      makeTemplate({ endDate: new Date('2026-04-30') }) as never,
    );

    await poster.postDueRecurringJournalEntries();

    expect(recurringEntries.markRun).toHaveBeenCalledWith('tenant-1', 'rec-1', {
      lastRunDate: new Date('2026-04-05'),
      nextRunDate: new Date('2026-05-05'),
      isActive: false,
    });
  });

  it('skips a template that was paused or deleted between listing and posting', async () => {
    recurringEntries.listDue.mockResolvedValue([{ id: 'rec-1', tenantId: 'tenant-1' }]);
    recurringEntries.findById.mockResolvedValue(null);

    await poster.postDueRecurringJournalEntries();

    expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
    expect(recurringEntries.markRun).not.toHaveBeenCalled();
  });

  it('skips a template that has since been paused (isActive false)', async () => {
    recurringEntries.listDue.mockResolvedValue([{ id: 'rec-1', tenantId: 'tenant-1' }]);
    recurringEntries.findById.mockResolvedValue(makeTemplate({ isActive: false }) as never);

    await poster.postDueRecurringJournalEntries();

    expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
    expect(recurringEntries.markRun).not.toHaveBeenCalled();
  });

  it('isolates one template failing to post from the rest of the sweep', async () => {
    recurringEntries.listDue.mockResolvedValue([
      { id: 'rec-1', tenantId: 'tenant-1' },
      { id: 'rec-2', tenantId: 'tenant-2' },
    ]);
    recurringEntries.findById.mockImplementation((tenantId) =>
      Promise.resolve(
        tenantId === 'tenant-1'
          ? (makeTemplate() as never)
          : (makeTemplate({ id: 'rec-2', tenantId: 'tenant-2' }) as never),
      ),
    );
    journalEntries.createIfNotExists
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ id: 'entry-2' } as never);

    await poster.postDueRecurringJournalEntries();

    expect(journalEntries.createIfNotExists).toHaveBeenCalledTimes(2);
    expect(recurringEntries.markRun).toHaveBeenCalledTimes(1);
    expect(recurringEntries.markRun).toHaveBeenCalledWith('tenant-2', 'rec-2', expect.anything());
  });
});
