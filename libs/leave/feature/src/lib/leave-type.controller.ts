import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { LeaveTypeService } from './leave-type.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@ApiTags('leave-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/leave-types')
export class LeaveTypeController {
  constructor(private readonly leaveTypes: LeaveTypeService) {}

  @Post()
  @RequirePermissions(Permission.LEAVE_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateLeaveTypeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveTypes.create(tenantId, dto, actor.sub);
  }

  // No permission requirement beyond authentication: every employee needs
  // to see the catalog in order to file their own leave request.
  @Get()
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('activeOnly') activeOnly?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveTypes.list(tenantId, { activeOnly: activeOnly === 'true' });
  }

  @Patch(':id')
  @RequirePermissions(Permission.LEAVE_MANAGE)
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.leaveTypes.update(tenantId, id, dto, actor.sub);
  }
}
