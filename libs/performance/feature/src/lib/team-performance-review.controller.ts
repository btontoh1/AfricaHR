import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { PerformanceReviewService } from './performance-review.service';
import { PerformanceReviewResponseDto } from './dto/performance-review-response.dto';
import { TeamPerformanceReviewResponseDto } from './dto/team-performance-review-response.dto';
import { SubmitManagerAssessmentDto } from './dto/submit-manager-assessment.dto';

/**
 * Direct-manager access: no @RequirePermissions — authorization is checked
 * dynamically per request (is the caller the target employee's direct
 * manager via Employee.managerId), not by role permission. This is the
 * new third authorization tier this module introduces (see project
 * memory). Registered before PerformanceReviewController in the module so
 * this literal "/team" path is matched before that controller's "/:id"
 * route.
 */
@ApiTags('performance-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.PERFORMANCE)
@Controller('tenants/:tenantId/performance-reviews/team')
export class TeamPerformanceReviewController {
  constructor(private readonly reviews: PerformanceReviewService) {}

  @Get()
  @ApiOkResponse({ type: TeamPerformanceReviewResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reviews.listForDirectReports(tenantId, actor.sub);
  }

  @Get(':id')
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.findByIdForManager(tenantId, actor.sub, id);
  }

  @Post(':id/manager-assessment')
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  submitManagerAssessment(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SubmitManagerAssessmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.submitManagerAssessmentAsManager(tenantId, actor.sub, id, dto);
  }
}
