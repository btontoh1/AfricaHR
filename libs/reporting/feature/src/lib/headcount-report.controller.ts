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
import { HeadcountReportResponseDto } from './dto/headcount-report-response.dto';
import { HeadcountReportService } from './headcount-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/headcount')
export class HeadcountReportController {
  constructor(private readonly headcount: HeadcountReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: HeadcountReportResponseDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
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
