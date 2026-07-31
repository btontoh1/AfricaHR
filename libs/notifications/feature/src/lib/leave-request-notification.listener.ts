import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Consumes the event LeaveRequestService emits after creating a request
 * (only when the employee has a direct manager with portal access). Lives
 * here, not in leave-feature, because scope:leave is not allowed to depend
 * on scope:notifications (see eslint.config.mjs module boundaries) — this
 * listener is the other half of that decoupling, so the event name below
 * must match libs/leave/feature/src/lib/leave-request.service.ts's
 * LEAVE_REQUEST_CREATED_EVENT literally; there's no shared type to enforce
 * it at compile time across the boundary.
 */
export interface LeaveRequestCreatedEventPayload {
  tenantId: string;
  managerUserId: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
}

@Injectable()
export class LeaveRequestNotificationListener {
  private readonly logger = new Logger(LeaveRequestNotificationListener.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent('leave.request.created')
  async handleLeaveRequestCreated(payload: LeaveRequestCreatedEventPayload): Promise<void> {
    try {
      await this.notifications.send(payload.tenantId, {
        userId: payload.managerUserId,
        channel: 'IN_APP',
        subject: `New leave request from ${payload.employeeName}`,
        body: `${payload.leaveTypeName}, ${payload.startDate} to ${payload.endDate}. Awaiting your approval.`,
      });
    } catch (error) {
      // A failed notification should never take down the leave-request
      // flow that triggered it — the request itself already succeeded and
      // was committed before this event fired.
      this.logger.error('Failed to notify manager of new leave request', error as Error);
    }
  }
}
