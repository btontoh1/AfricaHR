import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  FinanceOrganizationRepository,
  GlAccountRepository,
  GlJournalEntryRepository,
} from '@africahr/finance-data-access';
import { GlAccountCode } from '@africahr/finance-domain';
import { FinanceReportsService } from './finance-reports.service';
import { FinanceReportPdfService } from './finance-report-pdf.service';

describe('FinanceReportsService', () => {
  let service: FinanceReportsService;
  let accounts: jest.Mocked<GlAccountRepository>;
  let journalEntries: jest.Mocked<GlJournalEntryRepository>;
  let organizations: jest.Mocked<FinanceOrganizationRepository>;
  let pdf: jest.Mocked<FinanceReportPdfService>;

  beforeEach(() => {
    accounts = {
      ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<GlAccountRepository>;
    journalEntries = {
      listLinesInRange: jest.fn(),
      listLinesUpTo: jest.fn(),
    } as unknown as jest.Mocked<GlJournalEntryRepository>;
    organizations = {
      findById: jest.fn().mockResolvedValue({ id: 'org-1', legalName: 'Acme Ghana Ltd', address: null }),
    } as unknown as jest.Mocked<FinanceOrganizationRepository>;
    pdf = {
      renderProfitAndLoss: jest.fn().mockResolvedValue(Buffer.from('pdf')),
      renderCashFlow: jest.fn().mockResolvedValue(Buffer.from('pdf')),
      renderBalanceSheet: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    } as unknown as jest.Mocked<FinanceReportPdfService>;
    service = new FinanceReportsService(accounts, journalEntries, organizations, pdf);
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

  describe('profitAndLossPdf', () => {
    it('rejects when no organizationId is given', async () => {
      await expect(
        service.profitAndLossPdf('tenant-1', { from: new Date('2026-01-01'), to: new Date('2026-01-31') }),
      ).rejects.toThrow(BadRequestException);
      expect(organizations.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the organization does not exist', async () => {
      organizations.findById.mockResolvedValue(null);

      await expect(
        service.profitAndLossPdf('tenant-1', {
          organizationId: 'missing-org',
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('renders the report for the organization and returns the PDF buffer', async () => {
      journalEntries.listLinesInRange.mockResolvedValue([]);

      const result = await service.profitAndLossPdf('tenant-1', {
        organizationId: 'org-1',
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      expect(pdf.renderProfitAndLoss).toHaveBeenCalledWith(
        { id: 'org-1', legalName: 'Acme Ghana Ltd', address: null },
        expect.objectContaining({ organizationId: 'org-1' }),
      );
      expect(result).toEqual(Buffer.from('pdf'));
    });
  });

  describe('cashFlowPdf', () => {
    it('rejects when no organizationId is given', async () => {
      await expect(
        service.cashFlowPdf('tenant-1', { from: new Date('2026-01-01'), to: new Date('2026-01-31') }),
      ).rejects.toThrow(BadRequestException);
    });

    it('renders the report for the organization and returns the PDF buffer', async () => {
      journalEntries.listLinesInRange.mockResolvedValue([]);

      const result = await service.cashFlowPdf('tenant-1', {
        organizationId: 'org-1',
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      });

      expect(pdf.renderCashFlow).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('pdf'));
    });
  });

  describe('balanceSheetPdf', () => {
    it('rejects when no organizationId is given', async () => {
      await expect(service.balanceSheetPdf('tenant-1', { asOf: new Date('2026-01-31') })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('renders the report for the organization and returns the PDF buffer', async () => {
      journalEntries.listLinesUpTo.mockResolvedValue([]);

      const result = await service.balanceSheetPdf('tenant-1', { organizationId: 'org-1', asOf: new Date('2026-01-31') });

      expect(pdf.renderBalanceSheet).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('pdf'));
    });
  });
});
