import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { AttendanceRecordService } from './attendance-record.service';
import { AttendanceRecordResponseDto } from './dto/attendance-record-response.dto';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceRecordService) {}

  @Get()
  @RequirePermissions(Permission.ATTENDANCE_READ)
  @ApiOkResponse({ type: AttendanceRecordResponseDto, isArray: true })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.list(tenantId, { employeeId, from, to });
  }

  @Get(':id')
  @RequirePermissions(Permission.ATTENDANCE_READ)
  @ApiOkResponse({ type: AttendanceRecordResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  @ApiOkResponse({ type: AttendanceRecordResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAttendanceRecordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  @ApiOkResponse({ type: AttendanceRecordResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.update(tenantId, id, dto, actor.sub);
  }
}
