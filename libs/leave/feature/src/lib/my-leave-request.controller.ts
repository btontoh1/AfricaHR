import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

/**
 * Self-service: no @RequirePermissions on this controller — any
 * authenticated tenant member may act on their own leave requests
 * regardless of role. LeaveRequestService resolves "own" via
 * Employee.userId and 403s if the caller has no linked Employee record.
 * Registered before LeaveRequestController in the module so this
 * literal "/me" path is matched before that controller's "/:id" route.
 */
@ApiTags('leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-requests/me')
export class MyLeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.listForSelf(tenantId, actor.sub);
  }

  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.createForSelf(tenantId, actor.sub, dto);
  }

  @Post(':id/cancel')
  cancel(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.cancelForSelf(tenantId, actor.sub, id);
  }
}
