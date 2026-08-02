import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event LeaveRequestService emits after creating a request.
 * Lives here, not in leave-feature, because scope:leave is not allowed to
 * depend on scope:notifications (see eslint.config.mjs module boundaries)
 * — this listener is the other half of that decoupling, so the event name
 * below must match libs/leave/feature/src/lib/leave-request.service.ts's
 * LEAVE_REQUEST_CREATED_EVENT literally; there's no shared type to enforce
 * it at compile time across the boundary.
 */
export interface LeaveRequestCreatedEventPayload {
  tenantId: string;
  managerUserId: string | null;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
}

const LEAVE_APPROVAL_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER];

@Injectable()
export class LeaveRequestNotificationListener {
  private readonly logger = new Logger(LeaveRequestNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('leave.request.created')
  async handleLeaveRequestCreated(payload: LeaveRequestCreatedEventPayload): Promise<void> {
    // Every tenant admin/HR manager can act on this request regardless of
    // who it's routed to, so they're notified alongside (not instead of)
    // the specific manager - deduplicated via Set in case the manager
    // happens to also hold one of those roles.
    const recipientIds = new Set<string>();
    if (payload.managerUserId) {
      recipientIds.add(payload.managerUserId);
    }
    try {
      for (const id of await this.users.listActiveUserIdsByRole(payload.tenantId, LEAVE_APPROVAL_ROLES)) {
        recipientIds.add(id);
      }
    } catch (error) {
      this.logger.error('Failed to look up leave-approval recipients', error as Error);
    }

    const subject = `New leave request from ${payload.employeeName}`;
    const body = `${payload.leaveTypeName}, ${payload.startDate} to ${payload.endDate}. Awaiting approval.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the leave-request flow that triggered it (the
    // request itself already succeeded and was committed before this
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
        this.logger.error(`Failed to notify user "${userId}" of new leave request`, error as Error);
      }
    }
  }
}
