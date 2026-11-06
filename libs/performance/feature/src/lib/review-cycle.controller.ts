import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { AddOnModule, PerformanceReviewCycleStatus } from '@prisma/client';
import { ReviewCycleService } from './review-cycle.service';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { ReviewCycleResponseDto } from './dto/review-cycle-response.dto';
import { UpdateReviewCycleDto } from './dto/update-review-cycle.dto';

@ApiTags('review-cycles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.PERFORMANCE)
@Controller('tenants/:tenantId/review-cycles')
export class ReviewCycleController {
  constructor(private readonly cycles: ReviewCycleService) {}

  @Post()
  @RequirePermissions(Permission.PERFORMANCE_MANAGE)
  @ApiOkResponse({ type: ReviewCycleResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateReviewCycleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.cycles.create(tenantId, dto, actor.sub);
  }

  // No permission requirement beyond authentication: every employee needs
  // to see available cycles in order to start their own review.
  @Get()
  @ApiOkResponse({ type: ReviewCycleResponseDto, isArray: true })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('status') status?: PerformanceReviewCycleStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.cycles.list(tenantId, { status });
  }

  @Patch(':id')
  @RequirePermissions(Permission.PERFORMANCE_MANAGE)
  @ApiOkResponse({ type: ReviewCycleResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewCycleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.cycles.update(tenantId, id, dto, actor.sub);
  }
}
