import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { LeaveRequestService } from './leave-request.service';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { TeamLeaveRequestResponseDto } from './dto/team-leave-request-response.dto';

/**
 * Direct-manager access: no @RequirePermissions — authorization is checked
 * dynamically per request (is the caller the target employee's direct
 * manager via Employee.managerId), the same third authorization tier
 * TeamPerformanceReviewController introduced for performance reviews.
 * Registered before LeaveRequestController in the module so this literal
 * "/team" path is matched before that controller's "/:id" route.
 */
@ApiTags('leave-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-requests/team')
export class TeamLeaveRequestController {
  constructor(private readonly leaveRequests: LeaveRequestService) {}

  @Get()
  @ApiOkResponse({ type: TeamLeaveRequestResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.listForDirectReports(tenantId, actor.sub);
  }

  @Post(':id/approve')
  @ApiOkResponse({ type: LeaveRequestResponseDto })
  approve(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.approveAsManager(tenantId, actor.sub, id);
  }

  @Post(':id/reject')
  @ApiOkResponse({ type: LeaveRequestResponseDto })
  reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveRequests.rejectAsManager(tenantId, actor.sub, id, dto.rejectionReason);
  }
}
