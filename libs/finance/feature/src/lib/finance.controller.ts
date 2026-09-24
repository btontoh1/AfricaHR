import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { GlAccountResponseDto } from './dto/gl-account-response.dto';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';

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
}
