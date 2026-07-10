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
import { BenefitPlanService } from './benefit-plan.service';
import { CreateBenefitPlanDto } from './dto/create-benefit-plan.dto';
import { UpdateBenefitPlanDto } from './dto/update-benefit-plan.dto';

@ApiTags('benefit-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/benefit-plans')
export class BenefitPlanController {
  constructor(private readonly plans: BenefitPlanService) {}

  @Post()
  @RequirePermissions(Permission.BENEFITS_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateBenefitPlanDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.plans.create(tenantId, dto, actor.sub);
  }

  // No permission requirement beyond authentication: every employee needs
  // to see the catalog in order to enroll in a plan themselves.
  @Get()
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('activeOnly') activeOnly?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.plans.list(tenantId, { activeOnly: activeOnly === 'true' });
  }

  @Patch(':id')
  @RequirePermissions(Permission.BENEFITS_MANAGE)
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBenefitPlanDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.plans.update(tenantId, id, dto, actor.sub);
  }
}
