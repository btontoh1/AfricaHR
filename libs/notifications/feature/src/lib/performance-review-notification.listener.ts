import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event PerformanceReviewService emits after an employee
 * submits their self-assessment. Lives here, not in performance-feature,
 * because scope:performance is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries) — this
 * listener is the other half of that decoupling, so the event name below
 * must match
 * libs/performance/feature/src/lib/performance-review.service.ts's
 * PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT literally; there's no shared
 * type to enforce it at compile time across the boundary.
 */
export interface PerformanceReviewSelfSubmittedEventPayload {
  tenantId: string;
  managerUserId: string | null;
  employeeName: string;
  cycleName: string;
}

const PERFORMANCE_REVIEW_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class PerformanceReviewNotificationListener {
  private readonly logger = new Logger(PerformanceReviewNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('performance.review.self_submitted')
  async handleSelfAssessmentSubmitted(payload: PerformanceReviewSelfSubmittedEventPayload): Promise<void> {
    // Every tenant admin/HR manager can act on this review regardless of
    // who it's routed to, so they're notified alongside (not instead of)
    // the specific manager - deduplicated via Set in case the manager
    // happens to also hold one of those roles.
    const recipientIds = new Set<string>();
    if (payload.managerUserId) {
      recipientIds.add(payload.managerUserId);
    }
    try {
      for (const id of await this.users.listActiveUserIdsByRole(payload.tenantId, PERFORMANCE_REVIEW_ROLES)) {
        recipientIds.add(id);
      }
    } catch (error) {
      this.logger.error('Failed to look up performance-review recipients', error as Error);
    }

    const subject = `${payload.employeeName} submitted a self-assessment`;
    const body = `${payload.cycleName}. Awaiting your review.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the review flow that triggered it (the
    // self-assessment itself already succeeded and was committed before
    // this event fired).
    for (const userId of recipientIds) {
      try {
        await this.notifications.send(payload.tenantId, {
          userId,
          channel: 'IN_APP',
          subject,
          body,
        });
      } catch (error) {
        this.logger.error(`Failed to notify user "${userId}" of new self-assessment`, error as Error);
      }
    }
  }
}
