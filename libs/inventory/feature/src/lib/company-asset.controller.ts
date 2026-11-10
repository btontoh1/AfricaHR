import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CompanyAssetService } from './company-asset.service';
import { CreateCompanyAssetDto } from './dto/create-company-asset.dto';
import { UpdateCompanyAssetDto } from './dto/update-company-asset.dto';
import { AssignAssetDto } from './dto/assign-asset.dto';
import { ReturnAssetDto } from './dto/return-asset.dto';
import { CompanyAssetResponseDto } from './dto/company-asset-response.dto';
import { CompanyAssetAssignmentResponseDto } from './dto/company-asset-assignment-response.dto';

@ApiTags('inventory-assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/assets')
export class CompanyAssetController {
  constructor(private readonly assets: CompanyAssetService) {}

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateCompanyAssetDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CompanyAssetStatus })
  @ApiOkResponse({ type: CompanyAssetResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: CompanyAssetStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.assets.list(tenantId, { organizationId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyAssetDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.assets.update(tenantId, id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  delete(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.delete(tenantId, id, actor.sub);
  }

  @Post(':id/assign')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetAssignmentResponseDto })
  assign(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AssignAssetDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.assets.assign(tenantId, id, dto, actor.sub);
  }

  @Post(':id/return')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetAssignmentResponseDto })
  returnAsset(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReturnAssetDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.assets.returnAsset(tenantId, id, dto);
  }

  @Post(':id/retire')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  retire(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.retire(tenantId, id, actor.sub);
  }

  @Post(':id/maintenance')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  setMaintenance(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.setMaintenance(tenantId, id, actor.sub);
  }

  @Post(':id/make-available')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: CompanyAssetResponseDto })
  makeAvailable(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.makeAvailable(tenantId, id, actor.sub);
  }

  @Get(':id/assignments')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOkResponse({ type: CompanyAssetAssignmentResponseDto, isArray: true })
  assignmentHistory(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.assignmentHistory(tenantId, id);
  }
}
