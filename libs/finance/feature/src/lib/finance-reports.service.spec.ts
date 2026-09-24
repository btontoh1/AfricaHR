import { Prisma } from '@prisma/client';
import { GlAccountRepository, GlJournalEntryRepository } from '@africahr/finance-data-access';
import { GlAccountCode } from '@africahr/finance-domain';
import { FinanceReportsService } from './finance-reports.service';

describe('FinanceReportsService', () => {
  let service: FinanceReportsService;
  let accounts: jest.Mocked<GlAccountRepository>;
  let journalEntries: jest.Mocked<GlJournalEntryRepository>;

  beforeEach(() => {
    accounts = {
      ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<GlAccountRepository>;
    journalEntries = {
      listLinesInRange: jest.fn(),
      listLinesUpTo: jest.fn(),
    } as unknown as jest.Mocked<GlJournalEntryRepository>;
    service = new FinanceReportsService(accounts, journalEntries);
  });

  describe('profitAndLoss', () => {
    it('nets revenue and expense lines from the range into a report', async () => {
      journalEntries.listLinesInRange.mockResolvedValue([
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(5000),
          account: { type: 'REVENUE', code: GlAccountCode.REVENUE },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(3000),
          credit: new Prisma.Decimal(0),
          account: { type: 'EXPENSE', code: GlAccountCode.PAYROLL_EXPENSE },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(1150),
          credit: new Prisma.Decimal(0),
          account: { type: 'ASSET', code: GlAccountCode.ACCOUNTS_RECEIVABLE },
          journalEntry: { currency: 'GHS' },
        },
      ] as never);

      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');
      const report = await service.profitAndLoss('tenant-1', { organizationId: 'org-1', from, to });

      expect(accounts.ensureDefaultAccounts).toHaveBeenCalledWith('tenant-1');
      expect(report).toEqual({
        organizationId: 'org-1',
        from: from.toISOString(),
        to: to.toISOString(),
        byCurrency: [{ currency: 'GHS', totalRevenue: 5000, totalExpense: 3000, netIncome: 2000 }],
      });
    });

    it('never blends a multi-currency tenant\'s activity into one number', async () => {
      journalEntries.listLinesInRange.mockResolvedValue([
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(5000),
          account: { type: 'REVENUE', code: GlAccountCode.REVENUE },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(200000),
          account: { type: 'REVENUE', code: GlAccountCode.REVENUE },
          journalEntry: { currency: 'NGN' },
        },
      ] as never);

      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');
      const report = await service.profitAndLoss('tenant-1', { from, to });

      expect(report.byCurrency).toEqual([
        { currency: 'GHS', totalRevenue: 5000, totalExpense: 0, netIncome: 5000 },
        { currency: 'NGN', totalRevenue: 200000, totalExpense: 0, netIncome: 200000 },
      ]);
    });
  });

  describe('cashFlow', () => {
    it('only sums Cash and Bank lines, ignoring everything else', async () => {
      journalEntries.listLinesInRange.mockResolvedValue([
        {
          debit: new Prisma.Decimal(1150),
          credit: new Prisma.Decimal(0),
          account: { type: 'ASSET', code: GlAccountCode.CASH_AND_BANK },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(850),
          account: { type: 'ASSET', code: GlAccountCode.CASH_AND_BANK },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(5000),
          account: { type: 'REVENUE', code: GlAccountCode.REVENUE },
          journalEntry: { currency: 'GHS' },
        },
      ] as never);

      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');
      const report = await service.cashFlow('tenant-1', { from, to });

      expect(report.byCurrency).toEqual([{ currency: 'GHS', netCashChange: 300 }]);
    });
  });

  describe('balanceSheet', () => {
    it('computes asset/liability/equity balances as of the given date', async () => {
      journalEntries.listLinesUpTo.mockResolvedValue([
        {
          debit: new Prisma.Decimal(5000),
          credit: new Prisma.Decimal(0),
          account: { type: 'ASSET', code: GlAccountCode.CASH_AND_BANK },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(1000),
          account: { type: 'LIABILITY', code: GlAccountCode.TAX_PAYABLE },
          journalEntry: { currency: 'GHS' },
        },
        {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(4000),
          account: { type: 'REVENUE', code: GlAccountCode.REVENUE },
          journalEntry: { currency: 'GHS' },
        },
      ] as never);

      const asOf = new Date('2026-01-31');
      const report = await service.balanceSheet('tenant-1', { organizationId: 'org-1', asOf });

      expect(accounts.ensureDefaultAccounts).toHaveBeenCalledWith('tenant-1');
      expect(journalEntries.listLinesUpTo).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1', asOf });
      expect(report).toEqual({
        organizationId: 'org-1',
        asOf: asOf.toISOString(),
        byCurrency: [{ currency: 'GHS', totalAssets: 5000, totalLiabilities: 1000, totalEquity: 4000 }],
      });
    });
  });
});
