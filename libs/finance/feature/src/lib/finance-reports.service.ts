import { Injectable } from '@nestjs/common';
import { GlAccountRepository, GlJournalEntryRepository } from '@africahr/finance-data-access';
import { computeCashFlow, computeProfitAndLoss, GlAccountCode } from '@africahr/finance-domain';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';

export interface ReportRange {
  organizationId?: string;
  from: Date;
  to: Date;
}

@Injectable()
export class FinanceReportsService {
  constructor(
    private readonly accounts: GlAccountRepository,
    private readonly journalEntries: GlJournalEntryRepository,
  ) {}

  async profitAndLoss(tenantId: string, range: ReportRange): Promise<ProfitAndLossResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesInRange(tenantId, range);
    const report = computeProfitAndLoss(
      lines.map((line) => ({
        accountType: line.account.type,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    );
    return {
      organizationId: range.organizationId,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      ...report,
    };
  }

  async cashFlow(tenantId: string, range: ReportRange): Promise<CashFlowResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = await this.journalEntries.listLinesInRange(tenantId, range);
    const cashLines = lines
      .filter((line) => line.account.code === GlAccountCode.CASH_AND_BANK)
      .map((line) => ({ debit: Number(line.debit), credit: Number(line.credit) }));
    const report = computeCashFlow(cashLines);
    return {
      organizationId: range.organizationId,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      ...report,
    };
  }
}
