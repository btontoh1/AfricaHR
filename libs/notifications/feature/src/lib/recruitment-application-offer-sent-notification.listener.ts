import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event ApplicationService emits after sendOffer() records
 * offer details. Lives here, not in recruitment-feature, because
 * scope:recruitment is not allowed to depend on scope:notifications (see
 * eslint.config.mjs module boundaries) — this listener is the other half of
 * that decoupling, so the event name below must match
 * libs/recruitment/feature/src/lib/application.service.ts's
 * RECRUITMENT_APPLICATION_OFFER_SENT_EVENT literally; there's no shared type
 * to enforce it at compile time across the boundary.
 */
export interface RecruitmentApplicationOfferSentEventPayload {
  tenantId: string;
  hiringManagerUserId: string | null;
  candidateName: string;
  jobTitle: string;
  offeredSalary: number;
  offeredStartDate: string;
  actorUserId: string | null;
}

const RECRUITMENT_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class RecruitmentApplicationOfferSentNotificationListener {
  private readonly logger = new Logger(RecruitmentApplicationOfferSentNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('recruitment.application.offer_sent')
  async handleOfferSent(payload: RecruitmentApplicationOfferSentEventPayload): Promise<void> {
    // Same recipient shape as the other application-lifecycle listeners:
    // hiring manager plus every tenant admin/HR manager, deduplicated via
    // Set, actor removed afterwards (sendOffer() is HR/hiring-manager
    // driven, so the sender would otherwise self-notify every time).
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

    const subject = `An offer was sent to ${payload.candidateName}`;
    const body = `${payload.jobTitle} - starting ${payload.offeredStartDate}.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the offer-sending flow that triggered it (the
    // offer itself already succeeded and was committed before this event
    // fired).
    for (const userId of recipientIds) {
      try {
        await this.notifications.send(payload.tenantId, {
          userId,
          channel: 'IN_APP',
          subject,
          body,
        });
      } catch (error) {
        this.logger.error(`Failed to notify user "${userId}" of offer sent`, error as Error);
      }
    }
  }
}
