import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions, type RequestUser } from '@africahr/platform-auth';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';
import { PlatformOperatingCostService } from './platform-operating-cost.service';
import { PlatformInvestorMetricsService } from './platform-investor-metrics.service';
import { PlatformBillingSummaryResponseDto } from './dto/platform-billing-summary-response.dto';
import { PlatformSaasMetricsResponseDto } from './dto/platform-saas-metrics-response.dto';
import { SetOperatingCostDto } from './dto/set-operating-cost.dto';
import { OperatingCostResponseDto } from './dto/operating-cost-response.dto';
import { SetFinancialInputDto } from './dto/set-financial-input.dto';
import { FinancialInputResponseDto } from './dto/financial-input-response.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('platform-admin/billing')
export class PlatformBillingController {
  constructor(
    private readonly platformBilling: PlatformBillingService,
    private readonly platformSaasMetrics: PlatformSaasMetricsService,
    private readonly operatingCosts: PlatformOperatingCostService,
    private readonly investorMetrics: PlatformInvestorMetricsService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Platform-wide MRR, all-time revenue, and expiring subscriptions' })
  @ApiOkResponse({ type: PlatformBillingSummaryResponseDto })
  getSummary() {
    return this.platformBilling.getSummary();
  }

  @Get('saas-metrics')
  @ApiOperation({
    summary: 'MRR history, net-new MRR waterfall, churn, Rule of 40, subscription funnel, and cohort retention',
  })
  @ApiOkResponse({ type: PlatformSaasMetricsResponseDto })
  getSaasMetrics() {
    return this.platformSaasMetrics.getSaasMetrics();
  }

  @Get('operating-costs')
  @ApiOperation({ summary: "ParotHR's own hand-entered monthly operating costs, feeding the Rule of 40 profit margin" })
  @ApiOkResponse({ type: OperatingCostResponseDto, isArray: true })
  listOperatingCosts() {
    return this.operatingCosts.listCosts();
  }

  @Post('operating-costs')
  @ApiOperation({ summary: 'Set (or overwrite) the operating cost for one month/currency' })
  @ApiOkResponse({ type: OperatingCostResponseDto })
  setOperatingCost(@Body() dto: SetOperatingCostDto, @CurrentUser() actor: RequestUser) {
    return this.operatingCosts.setCost(dto, actor);
  }

  @Get('acquisition-costs')
  @ApiOperation({ summary: "ParotHR's own hand-entered monthly acquisition (sales+marketing) spend, feeding LTV:CAC" })
  @ApiOkResponse({ type: FinancialInputResponseDto, isArray: true })
  listAcquisitionCosts() {
    return this.investorMetrics.listAcquisitionCosts();
  }

  @Post('acquisition-costs')
  @ApiOperation({ summary: 'Set (or overwrite) the acquisition cost for one month/currency' })
  @ApiOkResponse({ type: FinancialInputResponseDto })
  setAcquisitionCost(@Body() dto: SetFinancialInputDto, @CurrentUser() actor: RequestUser) {
    return this.investorMetrics.setAcquisitionCost(dto, actor);
  }

  @Get('cash-balances')
  @ApiOperation({ summary: "ParotHR's own hand-entered end-of-month cash balance, feeding runway and the burn multiple" })
  @ApiOkResponse({ type: FinancialInputResponseDto, isArray: true })
  listCashBalances() {
    return this.investorMetrics.listCashBalances();
  }

  @Post('cash-balances')
  @ApiOperation({ summary: 'Set (or overwrite) the cash balance for one month/currency' })
  @ApiOkResponse({ type: FinancialInputResponseDto })
  setCashBalance(@Body() dto: SetFinancialInputDto, @CurrentUser() actor: RequestUser) {
    return this.investorMetrics.setCashBalance(dto, actor);
  }
}
