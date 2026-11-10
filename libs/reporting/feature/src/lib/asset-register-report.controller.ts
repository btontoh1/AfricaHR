import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule, CompanyAssetStatus } from '@prisma/client';
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
import { AssetRegisterReportDto } from './dto/asset-register-report-response.dto';
import { AssetRegisterReportService } from './asset-register-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/reports/asset-register')
export class AssetRegisterReportController {
  constructor(private readonly assets: AssetRegisterReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  @ApiOkResponse({ type: AssetRegisterReportDto })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(CompanyAssetStatus) })
  @ApiQuery({ name: 'category', required: false })
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('status') status?: CompanyAssetStatus,
    @Query('category') category?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.assets.generate(tenantId, { status, category });
  }
}
