import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { ProcurementSpendByVendorMonthDto } from './dto/procurement-spend-report-response.dto';
import { ProcurementSpendReportService } from './procurement-spend-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/reports/procurement-spend')
export class ProcurementSpendReportController {
  constructor(private readonly spend: ProcurementSpendReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: ProcurementSpendByVendorMonthDto, isArray: true })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('vendorId') vendorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.spend.generate(tenantId, { vendorId, from, to });
  }
}
