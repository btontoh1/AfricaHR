import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { NotificationService } from './notification.service';

/**
 * Consumes the event PayrollTransferWebhookListener emits when a payslip
 * has been PENDING past its critical-stale threshold - the reconciliation
 * sweep has had many chances to resolve it via Paystack and hasn't, so a
 * human should look. Lives here, not in payroll-feature, for the same
 * scope:payroll/scope:notifications boundary reason as
 * PayrollDisbursementFailedNotificationListener - the event name below
 * must match
 * libs/payroll/feature/src/lib/payroll-transfer-webhook.listener.ts's
 * PAYROLL_DISBURSEMENT_STUCK_EVENT literally.
 */
export interface PayrollDisbursementStuckEventPayload {
  tenantId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
}

const PAYROLL_ROLES: SystemRole[] = [SystemRole.TENANT_ADMIN, SystemRole.PAYROLL_MANAGER];

@Injectable()
export class PayrollDisbursementStuckNotificationListener {
  private readonly logger = new Logger(PayrollDisbursementStuckNotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly users: NotificationUserRepository,
  ) {}

  @OnEvent('payroll.payslip.disbursement_stuck')
  async handleDisbursementStuck(payload: PayrollDisbursementStuckEventPayload): Promise<void> {
    let recipientIds: string[];
    try {
      recipientIds = await this.users.listActiveUserIdsByRole(payload.tenantId, PAYROLL_ROLES);
    } catch (error) {
      this.logger.error('Failed to look up disbursement-stuck recipients', error as Error);
      return;
    }

    const subject = `Payment still pending for ${payload.employeeName}`;
    const body = `The Paystack transfer for the ${payload.periodStart} to ${payload.periodEnd} pay run has been pending for over 24 hours and needs manual attention.`;

    for (const userId of recipientIds) {
      try {
        await this.notifications.send(payload.tenantId, {
          userId,
          channel: 'IN_APP',
          subject,
          body,
        });
      } catch (error) {
        this.logger.error(`Failed to notify user "${userId}" of a stuck disbursement`, error as Error);
      }
    }
  }
}
