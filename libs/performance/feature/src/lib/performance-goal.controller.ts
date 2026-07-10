import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
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
import { PerformanceGoalStatus } from '@prisma/client';
import { PerformanceGoalService } from './performance-goal.service';
import { UpdatePerformanceGoalDto } from './dto/update-performance-goal.dto';

@ApiTags('performance-goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/performance-goals')
export class PerformanceGoalController {
  constructor(private readonly goals: PerformanceGoalService) {}

  @Get()
  @RequirePermissions(Permission.PERFORMANCE_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: PerformanceGoalStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.list(tenantId, { employeeId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.PERFORMANCE_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.PERFORMANCE_MANAGE)
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceGoalDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.update(tenantId, id, dto, actor.sub);
  }
}
