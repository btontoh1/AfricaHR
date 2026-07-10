import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { BenefitEnrollmentStatus } from '@prisma/client';
import { BenefitEnrollmentService } from './benefit-enrollment.service';
import { EnrollEmployeeDto } from './dto/enroll-employee.dto';

@ApiTags('benefit-enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/benefit-enrollments')
export class BenefitEnrollmentController {
  constructor(private readonly enrollments: BenefitEnrollmentService) {}

  @Get()
  @RequirePermissions(Permission.BENEFITS_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('benefitPlanId') benefitPlanId?: string,
    @Query('status') status?: BenefitEnrollmentStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.list(tenantId, { employeeId, benefitPlanId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.BENEFITS_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.findById(tenantId, id);
  }

  @Get(':id/contribution')
  @RequirePermissions(Permission.BENEFITS_READ)
  getContribution(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.getContribution(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.BENEFITS_MANAGE)
  enroll(
    @Param('tenantId') tenantId: string,
    @Body() dto: EnrollEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.enroll(tenantId, dto.employeeId, dto.benefitPlanId, dto.effectiveDate, actor.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.BENEFITS_MANAGE)
  cancel(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.enrollments.cancel(tenantId, id, actor.sub);
  }
}
