import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Permission, PermissionsGuard, RequestUser, RequirePermissions } from '@africahr/platform-auth';
import { PaystackFeeScheduleService } from './paystack-fee-schedule.service';
import { UpsertPaystackFeeRateDto } from './dto/upsert-paystack-fee-rate.dto';
import { PaystackFeeRateResponseDto } from './dto/paystack-fee-rate-response.dto';

/**
 * Platform-wide, not tenant-scoped - see PaystackTransferFeeRate's schema
 * comment. Lets a platform admin keep this in sync with Paystack's own
 * published transfer pricing without a code deploy.
 */
@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('platform-admin/paystack-fees')
export class PaystackFeeScheduleController {
  constructor(private readonly fees: PaystackFeeScheduleService) {}

  @Get()
  @ApiOperation({ summary: "Paystack's real transfer cost by currency and channel" })
  @ApiOkResponse({ type: PaystackFeeRateResponseDto, isArray: true })
  list() {
    return this.fees.list();
  }

  @Put()
  @ApiOperation({ summary: 'Set (or replace) the real transfer cost for one currency/channel pair' })
  @ApiOkResponse({ type: PaystackFeeRateResponseDto })
  upsert(@Body() dto: UpsertPaystackFeeRateDto, @CurrentUser() actor: RequestUser) {
    return this.fees.upsert(dto, actor);
  }
}
