import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event ApplicationService emits after an application's stage
 * changes (advance/respondToOffer). Lives here, not in recruitment-feature,
 * because scope:recruitment is not allowed to depend on scope:notifications
 * (see eslint.config.mjs module boundaries) — this listener is the other
 * half of that decoupling, so the event name below must match
 * libs/recruitment/feature/src/lib/application.service.ts's
 * RECRUITMENT_APPLICATION_STAGE_CHANGED_EVENT literally; there's no shared
 * type to enforce it at compile time across the boundary.
 */
export interface RecruitmentApplicationStageChangedEventPayload {
  tenantId: string;
  hiringManagerUserId: string | null;
  candidateName: string;
  jobTitle: string;
  stage: string;
  actorUserId: string | null;
}

const RECRUITMENT_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class RecruitmentApplicationStageChangedNotificationListener {
  private readonly logger = new Logger(RecruitmentApplicationStageChangedNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('recruitment.application.stage_changed')
  async handleApplicationStageChanged(
    payload: RecruitmentApplicationStageChangedEventPayload,
  ): Promise<void> {
    // Same recipient shape as the created-application listener: hiring
    // manager plus every tenant admin/HR manager, deduplicated via Set,
    // actor removed afterwards (advance() is HR/hiring-manager driven,
    // respondToOffer() is candidate-driven via a public link with no
    // portal actor - either way we never want to self-notify the actor).
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

    const subject = `${payload.candidateName}'s application moved to ${payload.stage}`;
    const body = `${payload.jobTitle}.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the stage-transition flow that triggered it
    // (the transition itself already succeeded and was committed before
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
        this.logger.error(`Failed to notify user "${userId}" of application stage change`, error as Error);
      }
    }
  }
}
