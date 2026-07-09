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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  @RequirePermissions(Permission.USER_MANAGE)
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: RequestUser) {
    return this.users.create(dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.USER_READ)
  list(@CurrentUser() actor: RequestUser) {
    return this.users.list(actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  findById(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.users.findById(actor, id);
  }

  @Patch(':id/role')
  @RequirePermissions(Permission.USER_MANAGE)
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.updateRole(actor, id, dto.role);
  }

  @Patch(':id/active')
  @RequirePermissions(Permission.USER_MANAGE)
  setActive(
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.users.setActive(actor, id, dto.isActive);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  softDelete(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.users.softDelete(actor, id);
  }
}
