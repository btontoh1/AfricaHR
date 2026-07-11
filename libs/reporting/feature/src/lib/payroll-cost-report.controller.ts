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
import { PayrollCostReportResponseDto } from './dto/payroll-cost-report-response.dto';
import { PayrollCostReportService } from './payroll-cost-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/payroll-cost')
export class PayrollCostReportController {
  constructor(private readonly payrollCost: PayrollCostReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: PayrollCostReportResponseDto })
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
    return this.payrollCost.generate(tenantId, { organizationId, from, to });
  }
}
