import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * Platform admins managing other PLATFORM_ADMIN accounts (tenantId: null) -
 * UserController's own routes always resolve the tenant from the actor's
 * own tenantId, which doesn't exist for this role, so this is a separate,
 * PLATFORM_ADMIN_MANAGE-gated surface rather than relaxing UserController
 * itself. Mirrors PlatformTenantUsersController's shape for the one role
 * that isn't scoped to a tenant.
 */
@ApiTags('platform-admins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_ADMIN_MANAGE)
@Controller('platform-admin/admins')
export class PlatformAdminsController {
  constructor(private readonly users: UserService) {}

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  list() {
    return this.users.listPlatformAdmins();
  }

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  create(@Body() dto: CreatePlatformAdminDto, @CurrentUser() actor: RequestUser) {
    return this.users.createPlatformAdmin(dto, actor);
  }

  @Patch(':id/active')
  @ApiOkResponse({ type: UserResponseDto })
  setActive(
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.setPlatformAdminActive(actor, id, dto.isActive);
  }
}
