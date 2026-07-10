import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { AttendanceRecordService } from './attendance-record.service';
import { AttendanceRecordResponseDto } from './dto/attendance-record-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller — any
 * authenticated tenant member may clock themselves in/out regardless of
 * role. AttendanceRecordService resolves "own" via Employee.userId and
 * 403s if the caller has no linked Employee record. Registered before
 * AttendanceController in the module so this literal "/me" path is
 * matched before that controller's "/:id" route (same gotcha as
 * MyLeaveRequestController in Module 5).
 */
@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/attendance/me')
export class MyAttendanceController {
  constructor(private readonly attendance: AttendanceRecordService) {}

  @Get()
  @ApiOkResponse({ type: AttendanceRecordResponseDto, isArray: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.listForSelf(tenantId, actor.sub, { from, to });
  }

  @Post('clock-in')
  @ApiOkResponse({ type: AttendanceRecordResponseDto })
  clockIn(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.attendance.clockInForSelf(tenantId, actor.sub);
  }

  @Post('clock-out')
  @ApiOkResponse({ type: AttendanceRecordResponseDto })
  clockOut(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.attendance.clockOutForSelf(tenantId, actor.sub);
  }
}
