import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { UserService } from './user.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * Platform-admin-only cross-tenant user management - UserController's own
 * routes always resolve the tenant from the actor's own tenantId, which a
 * platform admin doesn't have, so browsing/managing another tenant's users
 * needs this separate, PLATFORM_TENANT_MANAGE-gated surface instead of
 * relaxing UserController itself.
 */
@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_TENANT_MANAGE)
@Controller('tenants/:tenantId/users')
export class PlatformTenantUsersController {
  constructor(private readonly users: UserService) {}

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string) {
    return this.users.listForTenant(tenantId);
  }

  @Patch(':id/role')
  @ApiOkResponse({ type: UserResponseDto })
  updateRole(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.updateRoleForTenant(tenantId, id, dto.role, actor.sub);
  }

  @Patch(':id/active')
  @ApiOkResponse({ type: UserResponseDto })
  setActive(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.setActiveForTenant(tenantId, id, dto.isActive, actor.sub);
  }
}
