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
import { AttendanceReportResponseDto } from './dto/attendance-report-response.dto';
import { AttendanceReportService } from './attendance-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/attendance')
export class AttendanceReportController {
  constructor(private readonly attendance: AttendanceReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: AttendanceReportResponseDto })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.attendance.generate(tenantId, { organizationId, from, to });
  }
}
