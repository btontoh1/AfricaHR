import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';

/**
 * Platform-admin only: tenant onboarding is ops-provisioned, not self-serve
 * (see project memory for that decision).
 */
@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_TENANT_MANAGE)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() actor: RequestUser) {
    return this.tenants.create(dto, actor.sub);
  }

  @Get()
  list() {
    return this.tenants.list();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tenants.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.tenants.update(id, dto, actor.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.tenants.updateStatus(id, dto.status, actor.sub);
  }

  /** Offboarding - only reachable once the tenant is already CLOSED, see TenantService.softDelete's own doc comment. */
  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.tenants.softDelete(id, actor.sub);
  }
}
