import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { PrismaModule } from '@africahr/platform-database';
import { PerformanceDataAccessModule } from '@africahr/performance-data-access';
import { PerformanceGoalService } from './performance-goal.service';
import { MyPerformanceGoalController } from './my-performance-goal.controller';
import { PerformanceGoalController } from './performance-goal.controller';
import { ReviewCycleService } from './review-cycle.service';
import { ReviewCycleController } from './review-cycle.controller';
import { PerformanceReviewService } from './performance-review.service';
import { MyPerformanceReviewController } from './my-performance-review.controller';
import { TeamPerformanceReviewController } from './team-performance-review.controller';
import { PerformanceReviewController } from './performance-review.controller';

@Module({
  imports: [PerformanceDataAccessModule, PlatformAuthModule, AuditModule, PrismaModule],
  // Literal-path controllers ("/me", "/team") must be registered before
  // their sibling dynamic-path controllers ("/:id") so Nest's router
  // matches the literal segment first (same gotcha as Modules 5-7).
  controllers: [
    MyPerformanceGoalController,
    PerformanceGoalController,
    ReviewCycleController,
    MyPerformanceReviewController,
    TeamPerformanceReviewController,
    PerformanceReviewController,
  ],
  providers: [PerformanceGoalService, ReviewCycleService, PerformanceReviewService],
  exports: [PerformanceGoalService, ReviewCycleService, PerformanceReviewService],
})
export class PerformanceFeatureModule {}
