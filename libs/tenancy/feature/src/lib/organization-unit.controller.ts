import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { OrganizationUnitService } from './organization-unit.service';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { UpdateOrganizationUnitParentDto } from './dto/update-organization-unit-parent.dto';
import { OrganizationUnitResponseDto } from './dto/organization-unit-response.dto';

@ApiTags('organization-units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/organization-units')
export class OrganizationUnitController {
  constructor(private readonly units: OrganizationUnitService) {}

  @Post()
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationUnitResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOrganizationUnitDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.units.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationUnitResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: true })
  listByOrganization(
    @Param('tenantId') tenantId: string,
    @Query('organizationId') organizationId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.units.listByOrganization(tenantId, organizationId);
  }

  @Patch(':id/parent')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationUnitResponseDto })
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
