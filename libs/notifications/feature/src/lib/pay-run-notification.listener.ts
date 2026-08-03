import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event PayRunService emits the first time a pay run
 * finishes processing (DRAFT -> PROCESSING). Lives here, not in
 * payroll-feature, because scope:payroll is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries) — this
 * listener is the other half of that decoupling, so the event name below
 * must match libs/payroll/feature/src/lib/pay-run.service.ts's
 * PAY_RUN_PROCESSED_EVENT literally; there's no shared type to enforce
 * it at compile time across the boundary.
 */
export interface PayRunProcessedEventPayload {
  tenantId: string;
  payRunId: string;
  periodStart: string;
  periodEnd: string;
  employeeCount: number;
  actorUserId: string | null;
}

// PAYROLL_MANAGE holders only - unlike BENEFITS_MANAGE, HR_MANAGER does not
// hold PAYROLL_MANAGE (see system-role.ts), so it's excluded here.
const PAYROLL_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.PAYROLL_MANAGER];

@Injectable()
export class PayRunNotificationListener {
  private readonly logger = new Logger(PayRunNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('payroll.pay_run.processed')
  async handlePayRunProcessed(payload: PayRunProcessedEventPayload): Promise<void> {
    // Every pay-run action (process/approve/pay/close) shares one
    // permission, PAYROLL_MANAGE, so there's no separate manager
    // recipient to notify - just the pool of tenant admins/payroll
    // managers who can act on it. The actor is removed afterwards so
    // whoever just processed the run doesn't get notified that their own
    // run is ready for approval.
    let recipientIds: Set<string>;
    try {
      recipientIds = new Set(await this.users.listActiveUserIdsByRole(payload.tenantId, PAYROLL_ROLES));
    } catch (error) {
      this.logger.error('Failed to look up pay-run recipients', error as Error);
      return;
    }
    if (payload.actorUserId) {
      recipientIds.delete(payload.actorUserId);
    }

    const subject = `Pay run for ${payload.periodStart} to ${payload.periodEnd} is ready for approval`;
    const body = `${payload.employeeCount} payslip(s) computed.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the processing flow that triggered it (the
    // pay run itself already succeeded and was committed before this
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
        this.logger.error(`Failed to notify user "${userId}" of processed pay run`, error as Error);
      }
    }
  }
}
