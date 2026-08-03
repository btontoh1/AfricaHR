import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event PayrollTransferWebhookListener emits when a
 * Paystack transfer comes back failed. Lives here, not in
 * payroll-feature, because scope:payroll is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries) - this
 * listener is the other half of that decoupling, so the event name
 * below must match
 * libs/payroll/feature/src/lib/payroll-transfer-webhook.listener.ts's
 * PAYROLL_DISBURSEMENT_FAILED_EVENT literally; there's no shared type
 * to enforce it at compile time across the boundary.
 */
export interface PayrollDisbursementFailedEventPayload {
  tenantId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
}

// Same recipient pool as pay-run-processed notifications - PAYROLL_MANAGE
// holders only (TENANT_ADMIN, PAYROLL_MANAGER - HR_MANAGER doesn't hold it).
const PAYROLL_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.PAYROLL_MANAGER];

@Injectable()
export class PayrollDisbursementFailedNotificationListener {
  private readonly logger = new Logger(PayrollDisbursementFailedNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('payroll.payslip.disbursement_failed')
  async handleDisbursementFailed(payload: PayrollDisbursementFailedEventPayload): Promise<void> {
    // Unlike pay-run-processed, this event has no actor to exclude - it
    // fires from an async Paystack webhook, not a request any particular
    // user made, so every tenant admin/payroll manager gets notified.
    let recipientIds: string[];
    try {
      recipientIds = await this.users.listActiveUserIdsByRole(payload.tenantId, PAYROLL_ROLES);
    } catch (error) {
      this.logger.error('Failed to look up disbursement-failure recipients', error as Error);
      return;
    }

    const subject = `Payment failed for ${payload.employeeName}`;
    const body = `Could not disburse pay for the ${payload.periodStart} to ${payload.periodEnd} pay run via Paystack - check the employee's payment details and retry.`;

    // Each recipient is notified independently - one failed dispatch
    // shouldn't stop the others from being notified, and none of this
    // should ever take down the webhook handling that triggered it.
    for (const userId of recipientIds) {
      try {
        await this.notifications.send(payload.tenantId, {
          userId,
          channel: 'IN_APP',
          subject,
          body,
        });
      } catch (error) {
        this.logger.error(`Failed to notify user "${userId}" of a failed disbursement`, error as Error);
      }
    }
  }
}
