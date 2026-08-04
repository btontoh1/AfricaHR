import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event BenefitEnrollmentService emits after an enrollment is
 * cancelled. Lives here, not in benefits-feature, because scope:benefits
 * is not allowed to depend on scope:notifications (see eslint.config.mjs
 * module boundaries) — this listener is the other half of that
 * decoupling, so the event name below must match
 * libs/benefits/feature/src/lib/benefit-enrollment.service.ts's
 * BENEFIT_ENROLLMENT_CANCELLED_EVENT literally; there's no shared type to
 * enforce it at compile time across the boundary.
 */
export interface BenefitEnrollmentCancelledEventPayload {
  tenantId: string;
  employeeName: string;
  planName: string;
  actorUserId: string | null;
}

const BENEFITS_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class BenefitEnrollmentCancelledNotificationListener {
  private readonly logger = new Logger(BenefitEnrollmentCancelledNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('benefits.enrollment.cancelled')
  async handleEnrollmentCancelled(payload: BenefitEnrollmentCancelledEventPayload): Promise<void> {
    // Same recipient shape as the created-enrollment listener: tenant
    // admins/HR managers only, actor excluded (cancellation can likewise
    // be self-service or done on an employee's behalf).
    let recipientIds: Set<string>;
    try {
      recipientIds = new Set(await this.users.listActiveUserIdsByRole(payload.tenantId, BENEFITS_ROLES));
    } catch (error) {
      this.logger.error('Failed to look up benefit-enrollment-cancelled recipients', error as Error);
      return;
    }
    if (payload.actorUserId) {
      recipientIds.delete(payload.actorUserId);
    }

    const subject = `${payload.employeeName} cancelled ${payload.planName}`;
    const body = `Enrollment cancelled.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the cancellation flow that triggered it (the
    // cancellation itself already succeeded and was committed before this
    // event fired).
    for (const userId of recipientIds) {
      try {
        await this.notifications.send(payload.tenantId, {
          userId,
          channel: 'IN_APP',
          subject,
          body,
        });
      } catch (error) {
        this.logger.error(`Failed to notify user "${userId}" of enrollment cancellation`, error as Error);
      }
    }
  }
}
