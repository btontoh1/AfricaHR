import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { FinanceService } from './finance.service';
import { FinanceReportsService } from './finance-reports.service';
import { CreateManualJournalEntryDto } from './dto/create-manual-journal-entry.dto';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { SetPeriodCloseDto } from './dto/set-period-close.dto';
import { SetBudgetDto } from './dto/set-budget.dto';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { CreateRecurringJournalEntryDto } from './dto/create-recurring-journal-entry.dto';
import { UpdateRecurringJournalEntryDto } from './dto/update-recurring-journal-entry.dto';
import { SetHomeCurrencyDto } from './dto/set-home-currency.dto';
import { RunFxRevaluationDto } from './dto/run-fx-revaluation.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { GlAccountResponseDto } from './dto/gl-account-response.dto';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { TrialBalanceResponseDto } from './dto/trial-balance-response.dto';
import { BudgetVsActualResponseDto } from './dto/budget-vs-actual-response.dto';
import { PeriodCloseResponseDto } from './dto/period-close-response.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { BankReconciliationDetailResponseDto, BankReconciliationResponseDto } from './dto/bank-reconciliation-response.dto';
import { RecurringJournalEntryResponseDto } from './dto/recurring-journal-entry-response.dto';
import { HomeCurrencyResponseDto } from './dto/home-currency-response.dto';
import { FxRevaluationResponseDto } from './dto/fx-revaluation-response.dto';

// AddOnGuard runs after PermissionsGuard - order matters (NestJS runs
// @UseGuards left to right), so a caller without the base role permission
// gets that error rather than a leaked add-on/paywall message.
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.FINANCE)
@Controller('tenants/:tenantId/finance')
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly reports: FinanceReportsService,
  ) {}

  @Get('accounts')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: GlAccountResponseDto, isArray: true })
  listAccounts(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.finance.listAccounts(tenantId);
  }

  @Post('accounts')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: GlAccountResponseDto })
  createAccount(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateGlAccountDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.createAccount(tenantId, dto, actor);
  }

  @Patch('accounts/:id')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: GlAccountResponseDto })
  renameAccount(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGlAccountDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.renameAccount(tenantId, id, dto, actor);
  }

  @Post('journal-entries')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: JournalEntryResponseDto })
  createJournalEntry(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateManualJournalEntryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.createManualEntry(tenantId, dto, actor);
  }

  @Post('journal-entries/:id/void')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: JournalEntryResponseDto })
  voidJournalEntry(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.voidEntry(tenantId, id, actor);
  }

  @Get('journal-entries')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: JournalEntryResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  listJournalEntries(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.listJournalEntries(tenantId, organizationId);
  }

  @Get('reports/profit-and-loss')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: ProfitAndLossResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  profitAndLoss(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.profitAndLoss(tenantId, { organizationId, from: new Date(from), to: new Date(to) });
  }

  // organizationId is required here (unlike the JSON endpoint above) - a
  // PDF is always one organization's own letterhead, see
  // FinanceReportsService.requireOrganization. download=true sends
  // Content-Disposition: attachment (browser saves the file); the default
  // (inline) opens in the browser's own PDF viewer, same convention as
  // invoicing's CustomerInvoiceController.downloadPdf.
  @Get('reports/profit-and-loss/pdf')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async downloadProfitAndLossPdf(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
    @Query('organizationId') organizationId?: string,
    @Query('download') download?: string,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    const pdfBuffer = await this.reports.profitAndLossPdf(tenantId, {
      organizationId,
      from: new Date(from),
      to: new Date(to),
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download === 'true' ? 'attachment' : 'inline'}; filename="profit-and-loss.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get('reports/cash-flow')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: CashFlowResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  cashFlow(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.cashFlow(tenantId, { organizationId, from: new Date(from), to: new Date(to) });
  }

  @Get('reports/cash-flow/pdf')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async downloadCashFlowPdf(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
    @Query('organizationId') organizationId?: string,
    @Query('download') download?: string,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    const pdfBuffer = await this.reports.cashFlowPdf(tenantId, {
      organizationId,
      from: new Date(from),
      to: new Date(to),
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download === 'true' ? 'attachment' : 'inline'}; filename="cash-flow.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get('reports/balance-sheet')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: BalanceSheetResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'asOf', required: true })
  balanceSheet(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('asOf') asOf: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.balanceSheet(tenantId, { organizationId, asOf: new Date(asOf) });
  }

  @Get('reports/balance-sheet/pdf')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'asOf', required: true })
  async downloadBalanceSheetPdf(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('asOf') asOf: string,
    @Res() res: Response,
    @Query('organizationId') organizationId?: string,
    @Query('download') download?: string,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    const pdfBuffer = await this.reports.balanceSheetPdf(tenantId, { organizationId, asOf: new Date(asOf) });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download === 'true' ? 'attachment' : 'inline'}; filename="balance-sheet.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get('reports/trial-balance')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: TrialBalanceResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'asOf', required: true })
  trialBalance(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('asOf') asOf: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.trialBalance(tenantId, { organizationId, asOf: new Date(asOf) });
  }

  @Get('reports/trial-balance/pdf')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'asOf', required: true })
  async downloadTrialBalancePdf(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('asOf') asOf: string,
    @Res() res: Response,
    @Query('organizationId') organizationId?: string,
    @Query('download') download?: string,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    const pdfBuffer = await this.reports.trialBalancePdf(tenantId, { organizationId, asOf: new Date(asOf) });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download === 'true' ? 'attachment' : 'inline'}; filename="trial-balance.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get('reports/budget-vs-actual')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: BudgetVsActualResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'fiscalYear', required: true })
  budgetVsActual(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('fiscalYear') fiscalYear: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.budgetVsActual(tenantId, { organizationId, fiscalYear: Number(fiscalYear) });
  }

  @Get('budgets')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: BudgetResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'fiscalYear', required: false })
  listBudgets(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('fiscalYear') fiscalYear?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.listBudgets(tenantId, organizationId, fiscalYear ? Number(fiscalYear) : undefined);
  }

  @Post('budgets')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: BudgetResponseDto })
  setBudget(@Param('tenantId') tenantId: string, @Body() dto: SetBudgetDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.finance.setBudget(tenantId, dto, actor);
  }

  @Delete('budgets/:id')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBudget(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.finance.deleteBudget(tenantId, id, actor);
  }

  @Get('period-close')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: PeriodCloseResponseDto })
  @ApiQuery({ name: 'organizationId', required: true })
  getPeriodClose(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.getPeriodClose(tenantId, organizationId);
  }

  @Post('period-close')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: PeriodCloseResponseDto })
  setPeriodClose(
    @Param('tenantId') tenantId: string,
    @Body() dto: SetPeriodCloseDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.setPeriodClose(tenantId, dto, actor);
  }

  @Get('bank-reconciliations')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: BankReconciliationResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  listReconciliations(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.listReconciliations(tenantId, organizationId);
  }

  @Post('bank-reconciliations')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: BankReconciliationResponseDto })
  createReconciliation(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateBankReconciliationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.createReconciliation(tenantId, dto, actor);
  }

  @Get('bank-reconciliations/:id')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: BankReconciliationDetailResponseDto })
  getReconciliationDetail(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.finance.getReconciliationDetail(tenantId, id);
  }

  @Post('bank-reconciliations/:id/lines/:lineId/toggle')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  toggleReconciliationLine(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.toggleLine(tenantId, id, lineId, actor);
  }

  @Post('bank-reconciliations/:id/complete')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: BankReconciliationResponseDto })
  completeReconciliation(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.finance.completeReconciliation(tenantId, id, actor);
  }

  @Delete('bank-reconciliations/:id')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReconciliation(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.finance.deleteReconciliation(tenantId, id, actor);
  }

  @Get('recurring-journal-entries')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: RecurringJournalEntryResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  listRecurringJournalEntries(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.listRecurringJournalEntries(tenantId, organizationId);
  }

  @Post('recurring-journal-entries')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: RecurringJournalEntryResponseDto })
  createRecurringJournalEntry(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateRecurringJournalEntryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.createRecurringJournalEntry(tenantId, dto, actor);
  }

  @Patch('recurring-journal-entries/:id')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: RecurringJournalEntryResponseDto })
  setRecurringJournalEntryActive(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringJournalEntryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.setRecurringJournalEntryActive(tenantId, id, dto, actor);
  }

  @Delete('recurring-journal-entries/:id')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRecurringJournalEntry(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.finance.deleteRecurringJournalEntry(tenantId, id, actor);
  }

  @Get('home-currency')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: HomeCurrencyResponseDto })
  @ApiQuery({ name: 'organizationId', required: true })
  getHomeCurrency(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.getHomeCurrency(tenantId, organizationId);
  }

  @Post('home-currency')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: HomeCurrencyResponseDto })
  setHomeCurrency(@Param('tenantId') tenantId: string, @Body() dto: SetHomeCurrencyDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.finance.setHomeCurrency(tenantId, dto, actor);
  }

  @Get('fx-revaluations')
  @RequirePermissions(Permission.FINANCE_READ)
  @ApiOkResponse({ type: FxRevaluationResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  listFxRevaluations(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.listFxRevaluations(tenantId, organizationId);
  }

  @Post('fx-revaluations')
  @RequirePermissions(Permission.FINANCE_MANAGE)
  @ApiOkResponse({ type: FxRevaluationResponseDto })
  runFxRevaluation(
    @Param('tenantId') tenantId: string,
    @Body() dto: RunFxRevaluationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.finance.runFxRevaluation(tenantId, dto, actor);
  }
}
