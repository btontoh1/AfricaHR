import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { PerformanceReviewService } from './performance-review.service';
import { StartReviewDto } from './dto/start-review.dto';
import { SubmitSelfAssessmentDto } from './dto/submit-self-assessment.dto';

/**
 * Self-service: no @RequirePermissions — any authenticated tenant member
 * may start/view their own review and submit their self-assessment
 * regardless of role. Registered before TeamPerformanceReviewController
 * and PerformanceReviewController in the module so this literal "/me"
 * path is matched before either "/team" or "/:id".
 */
@ApiTags('performance-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/performance-reviews/me')
export class MyPerformanceReviewController {
  constructor(private readonly reviews: PerformanceReviewService) {}

  @Get()
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reviews.listForSelf(tenantId, actor.sub);
  }

  @Post()
  start(
    @Param('tenantId') tenantId: string,
    @Body() dto: StartReviewDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.startForSelf(tenantId, actor.sub, dto.cycleId);
  }

  @Get(':id')
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.findByIdForSelf(tenantId, actor.sub, id);
  }

  @Post(':id/self-assessment')
  submitSelfAssessment(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SubmitSelfAssessmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.submitSelfAssessmentForSelf(tenantId, actor.sub, id, dto);
  }
}
