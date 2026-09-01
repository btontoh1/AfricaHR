import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
} from '@africahr/platform-auth';
import { AddOnModule } from '@prisma/client';
import { PerformanceGoalService } from './performance-goal.service';
import { CreatePerformanceGoalDto } from './dto/create-performance-goal.dto';
import { PerformanceGoalResponseDto } from './dto/performance-goal-response.dto';
import { UpdatePerformanceGoalDto } from './dto/update-performance-goal.dto';

/**
 * Self-service: no @RequirePermissions — any authenticated tenant member
 * may manage their own goals regardless of role. Registered before
 * PerformanceGoalController in the module so this literal "/me" path is
 * matched before that controller's "/:id" route (same gotcha as Modules
 * 5-7).
 */
@ApiTags('performance-goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.PERFORMANCE)
@Controller('tenants/:tenantId/performance-goals/me')
export class MyPerformanceGoalController {
  constructor(private readonly goals: PerformanceGoalService) {}

  @Get()
  @ApiOkResponse({ type: PerformanceGoalResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.goals.listForSelf(tenantId, actor.sub);
  }

  @Post()
  @ApiOkResponse({ type: PerformanceGoalResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePerformanceGoalDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.createForSelf(tenantId, actor.sub, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PerformanceGoalResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceGoalDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.goals.updateForSelf(tenantId, actor.sub, id, dto);
  }
}
