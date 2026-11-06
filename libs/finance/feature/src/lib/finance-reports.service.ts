import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FinanceOrganizationRepository,
  GlAccountRepository,
  GlBudgetRepository,
  GlJournalEntryRepository,
} from '@africahr/finance-data-access';
import {
  computeBalanceSheet,
  computeBudgetVsActual,
  computeCashFlow,
  computeProfitAndLoss,
  computeTrialBalance,
  GlAccountCode,
} from '@africahr/finance-domain';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { TrialBalanceResponseDto } from './dto/trial-balance-response.dto';
import { BudgetVsActualResponseDto } from './dto/budget-vs-actual-response.dto';
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
    private readonly budgets: GlBudgetRepository,
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

  async trialBalance(tenantId: string, query: BalanceSheetQuery): Promise<TrialBalanceResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesUpTo(tenantId, query);
    const byCurrency = computeTrialBalance(
      lines.map((line) => ({
        currency: line.journalEntry.currency,
        accountCode: line.account.code,
        accountName: line.account.name,
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

  /**
   * fiscalYear is always the full calendar year (Jan 1 - Dec 31) - no
   * partial-year "as of today" support in v1, same scope cut as GlBudget
   * itself not tracking a custom fiscal-year start. Only accounts with a
   * budget row for this organization/year appear - see
   * computeBudgetVsActual's own doc comment for why activity on an
   * unbudgeted account is silently excluded rather than shown as "no
   * budget."
   */
  async budgetVsActual(
    tenantId: string,
    query: { organizationId?: string; fiscalYear: number },
  ): Promise<BudgetVsActualResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const budgets = await this.budgets.list(tenantId, {
      organizationId: query.organizationId,
      fiscalYear: query.fiscalYear,
    });
    const from = new Date(Date.UTC(query.fiscalYear, 0, 1));
    const to = new Date(Date.UTC(query.fiscalYear, 11, 31, 23, 59, 59, 999));
    const lines = await this.journalEntries.listLinesInRange(tenantId, {
      organizationId: query.organizationId,
      from,
      to,
    });

    const byCurrency = computeBudgetVsActual(
      budgets.map((budget) => ({
        accountId: budget.accountId,
        accountCode: budget.account.code,
        accountName: budget.account.name,
        accountType: budget.account.type,
        currency: budget.currency,
        budgetAmount: Number(budget.amount),
      })),
      lines.map((line) => ({
        accountId: line.accountId,
        accountType: line.account.type,
        currency: line.journalEntry.currency,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    );

    return {
      organizationId: query.organizationId,
      fiscalYear: query.fiscalYear,
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

  async trialBalancePdf(tenantId: string, query: BalanceSheetQuery): Promise<Buffer> {
    const organization = await this.requireOrganization(tenantId, query.organizationId);
    const report = await this.trialBalance(tenantId, query);
    return this.pdf.renderTrialBalance(organization, report);
  }
}
