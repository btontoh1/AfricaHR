import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
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
import { PerformanceGoalStatus } from '@prisma/client';
import { PerformanceGoalService } from './performance-goal.service';
import { PerformanceGoalResponseDto } from './dto/performance-goal-response.dto';
import { UpdatePerformanceGoalDto } from './dto/update-performance-goal.dto';

@ApiTags('performance-goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/performance-goals')
export class PerformanceGoalController {
  constructor(private readonly goals: PerformanceGoalService) {}

  @Get()
  @RequirePermissions(Permission.PERFORMANCE_READ)
  @ApiOkResponse({ type: PerformanceGoalResponseDto, isArray: true })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false })
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
  @ApiOkResponse({ type: PerformanceGoalResponseDto })
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
  @ApiOkResponse({ type: PerformanceGoalResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceGoalDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.update(tenantId, id, dto, actor.sub);
  }

  // Narrower than the Patch above - PERFORMANCE_GOAL_DELETE, not
  // PERFORMANCE_MANAGE, so HR_MANAGER can edit goals but not delete them.
  // Only exposed here (admin surface), not on the self-service
  // MyPerformanceGoalController - an employee can't erase their own
  // performance history.
  @Delete(':id')
  @RequirePermissions(Permission.PERFORMANCE_GOAL_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    return this.goals.remove(tenantId, id, actor.sub);
  }
}
