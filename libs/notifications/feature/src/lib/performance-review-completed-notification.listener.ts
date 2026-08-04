import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Consumes the event PerformanceReviewService emits after a manager
 * completes their assessment. Lives here, not in performance-feature,
 * because scope:performance is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries) — this
 * listener is the other half of that decoupling, so the event name below
 * must match
 * libs/performance/feature/src/lib/performance-review.service.ts's
 * PERFORMANCE_REVIEW_COMPLETED_EVENT literally; there's no shared type to
 * enforce it at compile time across the boundary.
 */
export interface PerformanceReviewCompletedEventPayload {
  tenantId: string;
  employeeUserId: string;
  cycleName: string;
}

@Injectable()
export class PerformanceReviewCompletedNotificationListener {
  private readonly logger = new Logger(PerformanceReviewCompletedNotificationListener.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent('performance.review.completed')
  async handleReviewCompleted(payload: PerformanceReviewCompletedEventPayload): Promise<void> {
    // Single recipient - the reviewee themselves. The manager who just
    // completed the assessment is never the recipient, so unlike the
    // other listeners there's no role lookup or actor-exclusion here.
    try {
      await this.notifications.send(payload.tenantId, {
        userId: payload.employeeUserId,
        channel: 'IN_APP',
        subject: 'Your performance review is complete',
        body: `${payload.cycleName}. Your manager has submitted their assessment.`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify user "${payload.employeeUserId}" of completed review`,
        error as Error,
      );
    }
  }
}
