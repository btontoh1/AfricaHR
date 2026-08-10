import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: RequestUser) {
    return this.users.create(dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.USER_READ)
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  list(@CurrentUser() actor: RequestUser) {
    return this.users.list(actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  @ApiOkResponse({ type: UserResponseDto })
  findById(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.users.findById(actor, id);
  }

  @Patch(':id/profile')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.updateProfile(actor, id, dto);
  }

  @Patch(':id/password')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.adminResetPassword(actor, id, dto.newPassword);
  }

  @Patch(':id/role')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.updateRole(actor, id, dto.role, dto.organizationId);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  setActive(
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.setActive(actor, id, dto.isActive);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  @ApiOkResponse({ type: UserResponseDto })
  softDelete(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.users.softDelete(actor, id);
  }
}
