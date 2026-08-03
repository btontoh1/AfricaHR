import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event JobRequisitionService emits after a new requisition
 * is created. Lives here, not in recruitment-feature, because
 * scope:recruitment is not allowed to depend on scope:notifications (see
 * eslint.config.mjs module boundaries) — this listener is the other half
 * of that decoupling, so the event name below must match
 * libs/recruitment/feature/src/lib/job-requisition.service.ts's
 * RECRUITMENT_REQUISITION_CREATED_EVENT literally; there's no shared type
 * to enforce it at compile time across the boundary.
 */
export interface RecruitmentRequisitionCreatedEventPayload {
  tenantId: string;
  hiringManagerUserId: string | null;
  jobTitle: string;
  actorUserId: string | null;
}

const RECRUITMENT_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class JobRequisitionNotificationListener {
  private readonly logger = new Logger(JobRequisitionNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('recruitment.requisition.created')
  async handleRequisitionCreated(payload: RecruitmentRequisitionCreatedEventPayload): Promise<void> {
    // Every tenant admin/HR manager can act on this requisition regardless
    // of who it's assigned to, so they're notified alongside (not instead
    // of) the hiring manager - deduplicated via Set. The actor is removed
    // afterwards: requisitions can only be created by RECRUITMENT_MANAGE-
    // holding HR/admin staff (no self-service create), who would otherwise
    // self-notify every time they create one.
    const recipientIds = new Set<string>();
    if (payload.hiringManagerUserId) {
      recipientIds.add(payload.hiringManagerUserId);
    }
    try {
      for (const id of await this.users.listActiveUserIdsByRole(payload.tenantId, RECRUITMENT_ROLES)) {
        recipientIds.add(id);
      }
    } catch (error) {
      this.logger.error('Failed to look up job-requisition recipients', error as Error);
    }
    if (payload.actorUserId) {
      recipientIds.delete(payload.actorUserId);
    }

    const subject = `New job requisition: ${payload.jobTitle}`;
    const body = 'Ready for review.';

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the requisition flow that triggered it (the
    // requisition itself already succeeded and was committed before this
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
        this.logger.error(`Failed to notify user "${userId}" of new job requisition`, error as Error);
      }
    }
  }
}
