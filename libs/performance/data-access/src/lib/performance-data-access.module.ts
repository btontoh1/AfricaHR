import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { PerformanceGoalRepository } from './performance-goal.repository';
import { PerformanceReviewCycleRepository } from './performance-review-cycle.repository';
import { PerformanceReviewRepository } from './performance-review.repository';
import { PerformanceEmployeeRepository } from './performance-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PerformanceGoalRepository,
    PerformanceReviewCycleRepository,
    PerformanceReviewRepository,
    PerformanceEmployeeRepository,
  ],
  exports: [
    PerformanceGoalRepository,
    PerformanceReviewCycleRepository,
    PerformanceReviewRepository,
    PerformanceEmployeeRepository,
  ],
})
export class PerformanceDataAccessModule {}
