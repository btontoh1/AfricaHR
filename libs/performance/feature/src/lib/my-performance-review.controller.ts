import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { PerformanceReviewService } from './performance-review.service';
import { PerformanceReviewResponseDto } from './dto/performance-review-response.dto';
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
  @ApiOkResponse({ type: PerformanceReviewResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reviews.listForSelf(tenantId, actor.sub);
  }

  @Post()
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  start(
    @Param('tenantId') tenantId: string,
    @Body() dto: StartReviewDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.startForSelf(tenantId, actor.sub, dto.cycleId);
  }

  @Get(':id')
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.findByIdForSelf(tenantId, actor.sub, id);
  }

  @Post(':id/self-assessment')
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
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
