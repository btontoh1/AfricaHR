import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { AdjustLeaveBalanceDto } from './dto/adjust-leave-balance.dto';
import { LeaveBalanceResponseDto } from './dto/leave-balance-response.dto';

@ApiTags('leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  @RequirePermissions(Permission.LEAVE_READ)
  @ApiOkResponse({ type: LeaveRequestResponseDto, isArray: true })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(LeaveRequestStatus) })
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
  @ApiOkResponse({ type: LeaveRequestResponseDto })
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
  @ApiOkResponse({ type: LeaveRequestResponseDto })
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
  @ApiOkResponse({ type: LeaveRequestResponseDto })
  reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.reject(tenantId, id, dto.rejectionReason, actor.sub);
  }

  // No :id path param - LeaveBalance is lazily materialized (see
  // LeaveRequestService.adjustBalance's doc comment) so there's no
  // balance id an HR caller could know ahead of time. Targeted instead by
  // employeeId/leaveTypeId/year in the body, mirroring
  // EnrollEmployeeDto's "HR-facing arbitrary employee" convention.
  @Post('adjust-balance')
  @RequirePermissions(Permission.LEAVE_MANAGE)
  @ApiOkResponse({ type: LeaveBalanceResponseDto })
  adjustBalance(
    @Param('tenantId') tenantId: string,
    @Body() dto: AdjustLeaveBalanceDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.adjustBalance(tenantId, dto, actor.sub);
  }
}
