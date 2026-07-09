import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { LeaveRequestStatus } from '@prisma/client';
import { LeaveRequestService } from './leave-request.service';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';

@ApiTags('leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  @RequirePermissions(Permission.LEAVE_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: LeaveRequestStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.list(tenantId, { employeeId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.LEAVE_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.findById(tenantId, id);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.LEAVE_MANAGE)
  approve(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.approve(tenantId, id, actor.sub);
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.LEAVE_MANAGE)
  reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.reject(tenantId, id, dto.rejectionReason, actor.sub);
  }
}
