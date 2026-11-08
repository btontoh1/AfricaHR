import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { AttendanceLocationService } from './attendance-location.service';
import { AttendanceLocationResponseDto } from './dto/attendance-location-response.dto';
import { CreateAttendanceLocationDto } from './dto/create-attendance-location.dto';
import { UpdateAttendanceLocationDto } from './dto/update-attendance-location.dto';

@ApiTags('attendance-locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/attendance-locations')
export class AttendanceLocationController {
  constructor(private readonly locations: AttendanceLocationService) {}

  // No permission requirement beyond authentication: every employee may
  // want to see the tenant's configured locations, same rationale as
  // AttendancePolicyController.find.
  @Get()
  @ApiOkResponse({ type: AttendanceLocationResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.locations.list(tenantId);
  }

  @Post()
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  @ApiOkResponse({ type: AttendanceLocationResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAttendanceLocationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.locations.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  @ApiOkResponse({ type: AttendanceLocationResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceLocationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.locations.update(tenantId, id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.locations.delete(tenantId, id, actor.sub);
  }
}
