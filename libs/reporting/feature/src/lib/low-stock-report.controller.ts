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
import { LowStockRowDto } from './dto/low-stock-report-response.dto';
import { LowStockReportService } from './low-stock-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/reports/low-stock')
export class LowStockReportController {
  constructor(private readonly lowStock: LowStockReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: LowStockRowDto, isArray: true })
  @ApiQuery({ name: 'warehouseId', required: false })
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.lowStock.generate(tenantId, { warehouseId });
  }
}
