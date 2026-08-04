import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { LeaveRequestService } from './leave-request.service';
import { LeaveBalanceResponseDto } from './dto/leave-balance-response.dto';

/**
 * Self-service: no @RequirePermissions - any authenticated tenant member
 * may see their own leave balances regardless of role, mirroring
 * MyLeaveRequestController.
 */
@ApiTags('leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-balances/me')
export class MyLeaveBalanceController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  @ApiOkResponse({ type: LeaveBalanceResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.listBalancesForSelf(tenantId, actor.sub);
  }
}
