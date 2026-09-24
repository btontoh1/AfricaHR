import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FinanceOrganizationRepository,
  GlAccountRepository,
  GlJournalEntryRepository,
} from '@africahr/finance-data-access';
import { computeBalanceSheet, computeCashFlow, computeProfitAndLoss, GlAccountCode } from '@africahr/finance-domain';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { FinanceReportPdfService } from './finance-report-pdf.service';

export interface ReportRange {
  organizationId?: string;
  from: Date;
  to: Date;
}

export interface BalanceSheetQuery {
  organizationId?: string;
  asOf: Date;
}

@Injectable()
export class FinanceReportsService {
  constructor(
    private readonly accounts: GlAccountRepository,
    private readonly journalEntries: GlJournalEntryRepository,
    private readonly organizations: FinanceOrganizationRepository,
    private readonly pdf: FinanceReportPdfService,
  ) {}

  /** PDF export is always for a single organization's own letterhead - "all organizations" can't be exported since it isn't one legal entity's financial statement (see FinanceReportPdfService). */
  private async requireOrganization(tenantId: string, organizationId: string | undefined) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required to export a PDF - pick a single organization first');
    }
    const organization = await this.organizations.findById(tenantId, organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization "${organizationId}" not found`);
    }
    return organization;
  }

  async profitAndLoss(tenantId: string, range: ReportRange): Promise<ProfitAndLossResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesInRange(tenantId, range);
    const byCurrency = computeProfitAndLoss(
      lines.map((line) => ({
        currency: line.journalEntry.currency,
        accountType: line.account.type,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    );
    return {
      organizationId: range.organizationId,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      byCurrency,
    };
  }

  async cashFlow(tenantId: string, range: ReportRange): Promise<CashFlowResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesInRange(tenantId, range);
    const cashLines = lines
      .filter((line) => line.account.code === GlAccountCode.CASH_AND_BANK)
      .map((line) => ({
        currency: line.journalEntry.currency,
        debit: Number(line.debit),
        credit: Number(line.credit),
      }));
    const byCurrency = computeCashFlow(cashLines);
    return {
      organizationId: range.organizationId,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      byCurrency,
    };
  }

  async balanceSheet(tenantId: string, query: BalanceSheetQuery): Promise<BalanceSheetResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesUpTo(tenantId, query);
    const byCurrency = computeBalanceSheet(
      lines.map((line) => ({
        currency: line.journalEntry.currency,
        accountType: line.account.type,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    );
    return {
      organizationId: query.organizationId,
      asOf: query.asOf.toISOString(),
      byCurrency,
    };
  }

  async profitAndLossPdf(tenantId: string, range: ReportRange): Promise<Buffer> {
    const organization = await this.requireOrganization(tenantId, range.organizationId);
    const report = await this.profitAndLoss(tenantId, range);
    return this.pdf.renderProfitAndLoss(organization, report);
  }

  async cashFlowPdf(tenantId: string, range: ReportRange): Promise<Buffer> {
    const organization = await this.requireOrganization(tenantId, range.organizationId);
    const report = await this.cashFlow(tenantId, range);
    return this.pdf.renderCashFlow(organization, report);
  }

  async balanceSheetPdf(tenantId: string, query: BalanceSheetQuery): Promise<Buffer> {
    const organization = await this.requireOrganization(tenantId, query.organizationId);
    const report = await this.balanceSheet(tenantId, query);
    return this.pdf.renderBalanceSheet(organization, report);
  }
}
