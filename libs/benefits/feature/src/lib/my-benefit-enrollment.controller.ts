import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { BenefitEnrollmentService } from './benefit-enrollment.service';
import { CreateBenefitEnrollmentDto } from './dto/create-benefit-enrollment.dto';

/**
 * Self-service: no @RequirePermissions on this controller — any
 * authenticated tenant member may enroll in / cancel their own benefits
 * regardless of role. BenefitEnrollmentService resolves "own" via
 * Employee.userId. Registered before BenefitEnrollmentController in the
 * module so this literal "/me" path is matched before that controller's
 * "/:id" route (same gotcha as Modules 5/6).
 */
@ApiTags('benefit-enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/benefit-enrollments/me')
export class MyBenefitEnrollmentController {
  constructor(private readonly enrollments: BenefitEnrollmentService) {}

  @Get()
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.listForSelf(tenantId, actor.sub);
  }

  @Post()
  enroll(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateBenefitEnrollmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.enrollForSelf(tenantId, actor.sub, dto);
  }

  @Post(':id/cancel')
  cancel(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.cancelForSelf(tenantId, actor.sub, id);
  }
}
