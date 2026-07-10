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
import { HeadcountReportService } from './headcount-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/headcount')
export class HeadcountReportController {
  constructor(private readonly headcount: HeadcountReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.headcount.generate(tenantId, { organizationId, from, to });
  }
}
