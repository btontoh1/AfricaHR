import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event BenefitEnrollmentService emits after a new enrollment
 * is created. Lives here, not in benefits-feature, because scope:benefits
 * is not allowed to depend on scope:notifications (see eslint.config.mjs
 * module boundaries) — this listener is the other half of that
 * decoupling, so the event name below must match
 * libs/benefits/feature/src/lib/benefit-enrollment.service.ts's
 * BENEFIT_ENROLLMENT_CREATED_EVENT literally; there's no shared type to
 * enforce it at compile time across the boundary.
 */
export interface BenefitEnrollmentCreatedEventPayload {
  tenantId: string;
  employeeName: string;
  planName: string;
  effectiveDate: string;
  actorUserId: string | null;
}

const BENEFITS_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class BenefitEnrollmentNotificationListener {
  private readonly logger = new Logger(BenefitEnrollmentNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('benefits.enrollment.created')
  async handleEnrollmentCreated(payload: BenefitEnrollmentCreatedEventPayload): Promise<void> {
    // Enrollment has no manager-review step, so recipients are just tenant
    // admins/HR managers (BENEFITS_MANAGE holders) - unlike leave/
    // performance/recruitment there's no manager recipient here. The
    // actor is removed afterwards: like recruitment applications,
    // enrollments can be created directly by BENEFITS_MANAGE-holding
    // HR/admin staff on an employee's behalf, so without this they'd
    // notify themselves every time they enroll someone.
    let recipientIds: Set<string>;
    try {
      recipientIds = new Set(await this.users.listActiveUserIdsByRole(payload.tenantId, BENEFITS_ROLES));
    } catch (error) {
      this.logger.error('Failed to look up benefit-enrollment recipients', error as Error);
      return;
    }
    if (payload.actorUserId) {
      recipientIds.delete(payload.actorUserId);
    }

    const subject = `${payload.employeeName} enrolled in ${payload.planName}`;
    const body = `Effective ${payload.effectiveDate}.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the enrollment flow that triggered it (the
    // enrollment itself already succeeded and was committed before this
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
        this.logger.error(`Failed to notify user "${userId}" of new benefit enrollment`, error as Error);
      }
    }
  }
}
