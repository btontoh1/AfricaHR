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
import { InventoryValuationReportDto } from './dto/inventory-valuation-report-response.dto';
import { InventoryValuationReportService } from './inventory-valuation-report.service';

@ApiTags('reports')
@ApiBearerAuth()
// AddOnGuard/RequireAddOn(INVENTORY) is a deliberate deviation from this
// module's other report controllers (e.g. PayrollCostReportController) -
// Inventory, unlike Payroll/Recruitment, is an opt-in add-on (off by
// default), so a tenant without it enabled shouldn't be able to pull a
// report over data that doesn't apply to them.
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/reports/inventory-valuation')
export class InventoryValuationReportController {
  constructor(private readonly valuation: InventoryValuationReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: InventoryValuationReportDto })
  @ApiQuery({ name: 'warehouseId', required: false })
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.valuation.generate(tenantId, { warehouseId });
  }
}
