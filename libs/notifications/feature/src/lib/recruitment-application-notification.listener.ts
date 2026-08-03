import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event ApplicationService emits after a new application is
 * logged. Lives here, not in recruitment-feature, because
 * scope:recruitment is not allowed to depend on scope:notifications (see
 * eslint.config.mjs module boundaries) — this listener is the other half
 * of that decoupling, so the event name below must match
 * libs/recruitment/feature/src/lib/application.service.ts's
 * RECRUITMENT_APPLICATION_CREATED_EVENT literally; there's no shared type
 * to enforce it at compile time across the boundary.
 */
export interface RecruitmentApplicationCreatedEventPayload {
  tenantId: string;
  hiringManagerUserId: string | null;
  candidateName: string;
  jobTitle: string;
  actorUserId: string | null;
}

const RECRUITMENT_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class RecruitmentApplicationNotificationListener {
  private readonly logger = new Logger(RecruitmentApplicationNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('recruitment.application.created')
  async handleApplicationCreated(payload: RecruitmentApplicationCreatedEventPayload): Promise<void> {
    // Every tenant admin/HR manager can act on this application regardless
    // of who it's routed to, so they're notified alongside (not instead
    // of) the hiring manager - deduplicated via Set. The actor is removed
    // afterwards: unlike leave requests or self-assessments, applications
    // are logged by RECRUITMENT_MANAGE-holding HR/admin staff on a
    // candidate's behalf, so without this they'd notify themselves every
    // time they log one.
    const recipientIds = new Set<string>();
    if (payload.hiringManagerUserId) {
      recipientIds.add(payload.hiringManagerUserId);
    }
    try {
      for (const id of await this.users.listActiveUserIdsByRole(payload.tenantId, RECRUITMENT_ROLES)) {
        recipientIds.add(id);
      }
    } catch (error) {
      this.logger.error('Failed to look up recruitment-application recipients', error as Error);
    }
    if (payload.actorUserId) {
      recipientIds.delete(payload.actorUserId);
    }

    const subject = `New application from ${payload.candidateName}`;
    const body = `Applied for ${payload.jobTitle}.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the application flow that triggered it (the
    // application itself already succeeded and was committed before this
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
        this.logger.error(`Failed to notify user "${userId}" of new application`, error as Error);
      }
    }
  }
}
