import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { SubscriptionService } from './subscription.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { SubscriptionSummaryResponseDto } from './dto/subscription-response.dto';

/**
 * Platform-admin-only: subscriptions are assigned and managed by the
 * platform admin in v1, not the tenant itself (see project scoping
 * decision — no tenant self-serve checkout yet).
 */
@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('tenants/:tenantId/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: "Get a tenant's subscription, including current usage and amount due" })
  @ApiOkResponse({ type: SubscriptionSummaryResponseDto })
  get(@Param('tenantId') tenantId: string) {
    return this.subscriptions.getForTenant(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Assign a new per-seat subscription to a tenant' })
  assign(
    @Param('tenantId') tenantId: string,
    @Body() dto: AssignSubscriptionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.subscriptions.assign(tenantId, dto, actor.sub);
  }

  @Post('cancel')
  @ApiOperation({ summary: "Cancel a tenant's subscription" })
  cancel(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    return this.subscriptions.cancel(tenantId, actor.sub);
  }
}
