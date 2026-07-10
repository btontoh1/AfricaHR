import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { AttendancePolicyService } from './attendance-policy.service';
import { AttendancePolicyResponseDto } from './dto/attendance-policy-response.dto';
import { UpsertAttendancePolicyDto } from './dto/upsert-attendance-policy.dto';

@ApiTags('attendance-policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/attendance-policy')
export class AttendancePolicyController {
  constructor(private readonly policies: AttendancePolicyService) {}

  @Post()
  @RequirePermissions(Permission.ATTENDANCE_MANAGE)
  @ApiOkResponse({ type: AttendancePolicyResponseDto })
  upsert(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpsertAttendancePolicyDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.policies.upsert(tenantId, dto, actor.sub);
  }

  // No permission requirement beyond authentication: every employee may
  // want to see the standard-hours threshold, same rationale as LeaveType.
  @Get()
  @ApiOkResponse({ type: AttendancePolicyResponseDto })
  find(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.policies.find(tenantId);
  }
}
