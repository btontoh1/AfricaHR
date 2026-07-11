import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { LeaveUtilizationReportEntryResponseDto } from './dto/leave-utilization-report-entry-response.dto';
import { LeaveUtilizationReportService } from './leave-utilization-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/leave-utilization')
export class LeaveUtilizationReportController {
  constructor(private readonly leaveUtilization: LeaveUtilizationReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: LeaveUtilizationReportEntryResponseDto, isArray: true })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'leaveTypeId', required: false })
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
