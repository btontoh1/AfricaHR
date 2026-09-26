import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';
import { PlatformBillingSummaryResponseDto } from './dto/platform-billing-summary-response.dto';
import { PlatformSaasMetricsResponseDto } from './dto/platform-saas-metrics-response.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('platform-admin/billing')
export class PlatformBillingController {
  constructor(
    private readonly platformBilling: PlatformBillingService,
    private readonly platformSaasMetrics: PlatformSaasMetricsService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Platform-wide MRR, all-time revenue, and expiring subscriptions' })
  @ApiOkResponse({ type: PlatformBillingSummaryResponseDto })
  getSummary() {
    return this.platformBilling.getSummary();
  }

  @Get('saas-metrics')
  @ApiOperation({
    summary: 'MRR history, net-new MRR waterfall, churn, subscription funnel, and cohort retention',
  })
  @ApiOkResponse({ type: PlatformSaasMetricsResponseDto })
  getSaasMetrics() {
    return this.platformSaasMetrics.getSaasMetrics();
  }
}
