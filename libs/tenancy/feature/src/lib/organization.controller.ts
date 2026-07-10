import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/organizations')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.organizations.listByTenant(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.findById(tenantId, id);
  }
}
