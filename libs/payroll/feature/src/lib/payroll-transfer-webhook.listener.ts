import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Payslip, PayslipDisbursementStatus } from '@prisma/client';
import {
  PayrollDisbursementRepository,
  PayrollEmployeeRepository,
  PayRunRepository,
  PayslipRepository,
} from '@africahr/payroll-data-access';

/**
 * Consumes the event billing-feature's InvoiceService re-emits when the
 * single Paystack webhook endpoint sees a transfer.success/
 * transfer.failed/transfer.reversed event. Lives here, not in
 * billing-feature, because scope:payroll cannot depend on scope:billing
 * and vice versa (Nx module boundary) - see
 * libs/billing/feature/src/lib/invoice.service.ts's
 * PAYSTACK_TRANSFER_UPDATED_EVENT doc comment for the other half of this
 * decoupling. Both sides must agree on this literal string and payload
 * shape informally; there's no shared type between scopes for it.
 */
export interface PaystackTransferUpdatedEventPayload {
  reference: string;
  status: 'success' | 'failed';
}

/**
 * Emitted when a transfer comes back failed, so tenant admins/payroll
 * managers find out immediately instead of a payslip silently sitting
 * in FAILED with nobody looking. No actorUserId/exclusion here unlike
 * PayRunProcessedEvent - this fires from an async Paystack webhook, not
 * a request a particular user made, so there's no "actor" to skip.
 * Consumed by a listener living in notifications-feature -
 * scope:payroll is not allowed to depend on scope:notifications (see
 * eslint.config.mjs module boundaries), so this event is the decoupling
 * point between the two.
 */
export const PAYROLL_DISBURSEMENT_FAILED_EVENT = 'payroll.payslip.disbursement_failed';

export interface PayrollDisbursementFailedEvent {
  tenantId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
}

@Injectable()
export class PayrollTransferWebhookListener {
  private readonly logger = new Logger(PayrollTransferWebhookListener.name);

  constructor(
    private readonly disbursements: PayrollDisbursementRepository,
    private readonly payslips: PayslipRepository,
    private readonly payRuns: PayRunRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('payroll.paystack_transfer.updated')
  async handleTransferUpdated(payload: PaystackTransferUpdatedEventPayload): Promise<void> {
    const payslip = await this.disbursements.findPayslipByPaystackTransferReference(payload.reference);
    // Unknown reference (not one of ours) or already resolved to a
    // terminal state - Paystack retries webhooks that don't respond
    // 2xx, so a duplicate delivery isn't a failure, same posture as
    // InvoiceService.handlePaystackWebhook's idempotency check.
    if (!payslip || payslip.disbursementStatus !== PayslipDisbursementStatus.PENDING) {
      return;
    }

    const status = payload.status === 'success' ? PayslipDisbursementStatus.SUCCESS : PayslipDisbursementStatus.FAILED;

    let updated: Payslip;
    try {
      updated = await this.payslips.recordDisbursementResult(payslip.tenantId, payslip.id, status);
    } catch (error) {
      this.logger.error(`Failed to record disbursement result for payslip "${payslip.id}"`, error as Error);
      return;
    }

    if (status === PayslipDisbursementStatus.FAILED) {
      await this.notifyOfFailedDisbursement(updated);
    }
  }

  private async notifyOfFailedDisbursement(payslip: Payslip): Promise<void> {
    const [payRun, employee] = await Promise.all([
      this.payRuns.findById(payslip.tenantId, payslip.payRunId),
      this.employees.findById(payslip.tenantId, payslip.employeeId),
    ]);
    if (!payRun || !employee) {
      return;
    }

    const event: PayrollDisbursementFailedEvent = {
      tenantId: payslip.tenantId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      periodStart: payRun.periodStart.toISOString().slice(0, 10),
      periodEnd: payRun.periodEnd.toISOString().slice(0, 10),
    };
    this.eventEmitter.emit(PAYROLL_DISBURSEMENT_FAILED_EVENT, event);
  }
}
