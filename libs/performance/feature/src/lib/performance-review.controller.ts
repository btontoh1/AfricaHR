import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { PerformanceReviewStatus } from '@prisma/client';
import { PerformanceReviewService } from './performance-review.service';
import { PerformanceReviewResponseDto } from './dto/performance-review-response.dto';
import { StartReviewForEmployeeDto } from './dto/start-review-for-employee.dto';
import { SubmitManagerAssessmentDto } from './dto/submit-manager-assessment.dto';

@ApiTags('performance-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/performance-reviews')
export class PerformanceReviewController {
  constructor(private readonly reviews: PerformanceReviewService) {}

  @Get()
  @RequirePermissions(Permission.PERFORMANCE_READ)
  @ApiOkResponse({ type: PerformanceReviewResponseDto, isArray: true })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'cycleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('employeeId') employeeId?: string,
    @Query('cycleId') cycleId?: string,
    @Query('status') status?: PerformanceReviewStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.list(tenantId, { employeeId, cycleId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.PERFORMANCE_READ)
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.PERFORMANCE_MANAGE)
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  start(
    @Param('tenantId') tenantId: string,
    @Body() dto: StartReviewForEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.start(tenantId, dto.employeeId, dto.cycleId, actor.sub);
  }

  @Post(':id/manager-assessment')
  @RequirePermissions(Permission.PERFORMANCE_MANAGE)
  @ApiOkResponse({ type: PerformanceReviewResponseDto })
  submitManagerAssessment(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SubmitManagerAssessmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reviews.submitManagerAssessment(tenantId, id, dto, actor.sub);
  }
}
