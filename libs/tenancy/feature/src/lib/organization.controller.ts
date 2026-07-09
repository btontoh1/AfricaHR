import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { assertTenantScope } from './assert-tenant-scope';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ORGANIZATION_MANAGE)
@Controller('tenants/:tenantId/organizations')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.create(tenantId, dto, actor.sub);
  }

  @Get()
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.organizations.listByTenant(tenantId);
  }

  @Get(':id')
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.findById(tenantId, id);
  }
}
