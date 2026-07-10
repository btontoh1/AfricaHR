import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { LeaveUtilizationReportService } from './leave-utilization-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/leave-utilization')
export class LeaveUtilizationReportController {
  constructor(private readonly leaveUtilization: LeaveUtilizationReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('year') year?: string,
    @Query('organizationId') organizationId?: string,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveUtilization.generate(tenantId, { year, organizationId, leaveTypeId });
  }
}
