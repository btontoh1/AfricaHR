import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformBillingSummaryResponseDto } from './dto/platform-billing-summary-response.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('platform-admin/billing')
export class PlatformBillingController {
  constructor(private readonly platformBilling: PlatformBillingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Platform-wide MRR, all-time revenue, and expiring subscriptions' })
  @ApiOkResponse({ type: PlatformBillingSummaryResponseDto })
  getSummary() {
    return this.platformBilling.getSummary();
  }
}
