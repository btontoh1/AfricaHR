import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { OrganizationUnitService } from './organization-unit.service';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { UpdateOrganizationUnitParentDto } from './dto/update-organization-unit-parent.dto';
import { assertTenantScope } from './assert-tenant-scope';

@ApiTags('organization-units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ORGANIZATION_MANAGE)
@Controller('tenants/:tenantId/organization-units')
export class OrganizationUnitController {
  constructor(private readonly units: OrganizationUnitService) {}

  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOrganizationUnitDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.units.create(tenantId, dto, actor.sub);
  }

  @Get()
  listByOrganization(
    @Param('tenantId') tenantId: string,
    @Query('organizationId') organizationId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.units.listByOrganization(tenantId, organizationId);
  }

  @Patch(':id/parent')
  updateParent(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationUnitParentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.units.updateParent(tenantId, id, dto.parentId, actor.sub);
  }
}
