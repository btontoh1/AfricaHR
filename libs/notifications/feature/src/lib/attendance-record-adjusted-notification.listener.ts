import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Consumes the event AttendanceRecordService emits after an HR-manual
 * create()/update() of an attendance record. Lives here, not in
 * attendance-feature, because scope:attendance is not allowed to depend
 * on scope:notifications (see eslint.config.mjs module boundaries) —
 * this listener is the other half of that decoupling, so the event name
 * below must match
 * libs/attendance/feature/src/lib/attendance-record.service.ts's
 * ATTENDANCE_RECORD_ADJUSTED_EVENT literally; there's no shared type to
 * enforce it at compile time across the boundary.
 */
export interface AttendanceRecordAdjustedEventPayload {
  tenantId: string;
  employeeUserId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  action: 'created' | 'updated';
}

@Injectable()
export class AttendanceRecordAdjustedNotificationListener {
  private readonly logger = new Logger(AttendanceRecordAdjustedNotificationListener.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent('attendance.record.adjusted')
  async handleAttendanceRecordAdjusted(payload: AttendanceRecordAdjustedEventPayload): Promise<void> {
    const subject =
      payload.action === 'created'
        ? `An attendance record was added for ${payload.date}`
        : `Your attendance record for ${payload.date} was updated`;
    const body =
      payload.clockIn && payload.clockOut
        ? `Clock in ${payload.clockIn} · Clock out ${payload.clockOut}`
        : 'Reviewed by HR.';

    try {
      await this.notifications.send(payload.tenantId, {
        userId: payload.employeeUserId,
        channel: 'IN_APP',
        subject,
        body,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify user "${payload.employeeUserId}" of attendance record adjustment`,
        error as Error,
      );
    }
  }
}
