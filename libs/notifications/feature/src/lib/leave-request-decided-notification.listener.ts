import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Consumes the event LeaveRequestService emits after a request is
 * approved, rejected, or cancelled. Lives here, not in leave-feature,
 * because scope:leave is not allowed to depend on scope:notifications
 * (see eslint.config.mjs module boundaries) — this listener is the other
 * half of that decoupling, so the event name below must match
 * libs/leave/feature/src/lib/leave-request.service.ts's
 * LEAVE_REQUEST_DECIDED_EVENT literally; there's no shared type to
 * enforce it at compile time across the boundary.
 */
export interface LeaveRequestDecidedEventPayload {
  tenantId: string;
  employeeUserId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason: string | null;
  actorUserId: string | null;
}

@Injectable()
export class LeaveRequestDecidedNotificationListener {
  private readonly logger = new Logger(LeaveRequestDecidedNotificationListener.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent('leave.request.decided')
  async handleLeaveRequestDecided(payload: LeaveRequestDecidedEventPayload): Promise<void> {
    // Single recipient - the employee whose request it is. approve()/
    // reject() are always done by someone else, but a cancellation can be
    // the employee's own action (cancelForSelf), so skip notifying them
    // about their own cancellation.
    if (payload.actorUserId && payload.actorUserId === payload.employeeUserId) {
      return;
    }

    const subject = `Your ${payload.leaveTypeName} request was ${payload.status.toLowerCase()}`;
    const body = payload.rejectionReason
      ? `${payload.startDate} to ${payload.endDate}. ${payload.rejectionReason}`
      : `${payload.startDate} to ${payload.endDate}.`;

    try {
      await this.notifications.send(payload.tenantId, {
        userId: payload.employeeUserId,
        channel: 'IN_APP',
        subject,
        body,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify user "${payload.employeeUserId}" of leave request decision`,
        error as Error,
      );
    }
  }
}
