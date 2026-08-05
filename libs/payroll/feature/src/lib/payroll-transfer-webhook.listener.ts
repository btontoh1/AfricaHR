import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Payslip, PayslipDisbursementStatus } from '@prisma/client';
import {
  PayrollDisbursementRepository,
  PayrollEmployeeRepository,
  PayRunRepository,
  PayslipRepository,
  StalePendingDisbursement,
} from '@africahr/payroll-data-access';
import { PaystackTransferClient } from './paystack-transfer-client';

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
 * Emitted when a transfer resolves to FAILED (whether learned from the
 * webhook or the reconciliation sweep below), so tenant admins/payroll
 * managers find out immediately instead of a payslip silently sitting in
 * FAILED with nobody looking. No actorUserId/exclusion here unlike
 * PayRunProcessedEvent - neither trigger is a request a particular user
 * made, so there's no "actor" to skip. Consumed by a listener living in
 * notifications-feature - scope:payroll is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries), so this
 * event is the decoupling point between the two.
 */
export const PAYROLL_DISBURSEMENT_FAILED_EVENT = 'payroll.payslip.disbursement_failed';

/**
 * Emitted once per payslip when the reconciliation sweep below finds it
 * still PENDING past CRITICAL_STALE_THRESHOLD_MS - i.e. several 15-minute
 * sweeps and Paystack verify-transfer calls have gone by without it
 * resolving. Distinct from PAYROLL_DISBURSEMENT_FAILED_EVENT: Paystack
 * hasn't said the transfer failed, so this is "needs a human to look",
 * not "known to have failed". Same cross-scope decoupling as the FAILED
 * event - consumed by a listener in notifications-feature.
 */
export const PAYROLL_DISBURSEMENT_STUCK_EVENT = 'payroll.payslip.disbursement_stuck';

export interface PayrollDisbursementFailedEvent {
  tenantId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
}

/** Shared by this listener's own notifyOfFailedDisbursement and PayRunService's equivalent for a disbursement that fails before ever reaching PENDING (see PayRunService.markDisbursementInitiationFailed) - same event, two triggers. */
export function buildDisbursementFailedEvent(
  tenantId: string,
  employee: { firstName: string; lastName: string },
  payRun: { periodStart: Date; periodEnd: Date },
): PayrollDisbursementFailedEvent {
  return {
    tenantId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    periodStart: payRun.periodStart.toISOString().slice(0, 10),
    periodEnd: payRun.periodEnd.toISOString().slice(0, 10),
  };
}

/**
 * A transfer stuck this long without a webhook is worth double-checking
 * directly against Paystack, rather than waiting indefinitely. Exported
 * so PlatformDisbursementService can classify the same rows this sweep
 * itself queries for, without a second, differently-tuned definition of
 * "stale" living in two places.
 */
export const STALE_PENDING_THRESHOLD_MS = 30 * 60 * 1000;

/** Past this point, repeated 15-minute sweeps have already had many chances to resolve it via Paystack - worth alerting a human instead of trusting the next sweep. Exported for the same reason as STALE_PENDING_THRESHOLD_MS above. */
export const CRITICAL_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function mapVerifiedStatus(
  paystackStatus: string,
): typeof PayslipDisbursementStatus.SUCCESS | typeof PayslipDisbursementStatus.FAILED | null {
  if (paystackStatus === 'success') {
    return PayslipDisbursementStatus.SUCCESS;
  }
  if (paystackStatus === 'failed' || paystackStatus === 'reversed') {
    return PayslipDisbursementStatus.FAILED;
  }
  // Still settling (pending/processing/otp/...) - leave PENDING, the next
  // webhook delivery or reconciliation sweep will catch up to it.
  return null;
}

@Injectable()
export class PayrollTransferWebhookListener {
  private readonly logger = new Logger(PayrollTransferWebhookListener.name);

  /** Payslip ids already alerted on as critically stale, so a human isn't re-notified every 15 minutes about the same stuck disbursement. Reset on process restart - a possible duplicate alert after a redeploy is preferable to a missed one, and a resolved payslip drops out on its own (see alertOnCriticallyStaleDisbursements). */
  private readonly alertedStuckPayslipIds = new Set<string>();

  constructor(
    private readonly disbursements: PayrollDisbursementRepository,
    private readonly payslips: PayslipRepository,
    private readonly payRuns: PayRunRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystack: PaystackTransferClient,
  ) {}

  @OnEvent('payroll.paystack_transfer.updated')
  async handleTransferUpdated(payload: PaystackTransferUpdatedEventPayload): Promise<void> {
    const status =
      payload.status === 'success' ? PayslipDisbursementStatus.SUCCESS : PayslipDisbursementStatus.FAILED;
    await this.resolveIfPending(payload.reference, status);
  }

  /**
   * Catches a transfer whose webhook was never delivered - runs every 15
   * minutes, re-checking every payslip that's been PENDING for at least
   * STALE_PENDING_THRESHOLD_MS directly against Paystack's Verify
   * Transfer endpoint. One employee's stuck transfer (or a Paystack API
   * hiccup) isolated via a per-item try/catch, same posture as
   * PayRunService.initiateDisbursements.
   */
  @Cron('*/15 * * * *')
  async reconcileStalePendingDisbursements(): Promise<void> {
    const olderThan = new Date(Date.now() - STALE_PENDING_THRESHOLD_MS);
    let stale: StalePendingDisbursement[];
    try {
      stale = await this.disbursements.listStalePendingDisbursements(olderThan);
    } catch (error) {
      this.logger.error('Failed to list stale pending disbursements', error as Error);
      return;
    }

    for (const item of stale) {
      try {
        const verified = await this.paystack.verifyTransfer(item.paystackTransferReference);
        const status = mapVerifiedStatus(verified.status);
        if (status) {
          await this.resolveIfPending(item.paystackTransferReference, status);
        }
      } catch (error) {
        this.logger.error(`Failed to reconcile disbursement for payslip "${item.id}"`, error as Error);
      }
    }

    await this.alertOnCriticallyStaleDisbursements();
  }

  /**
   * Runs after the reconcile loop above so a payslip the sweep just
   * resolved this run doesn't get flagged. One-shot per payslip via
   * alertedStuckPayslipIds - a payslip only leaves PENDING once it
   * resolves, so there's no need to re-alert, just to stop tracking it
   * once it's no longer in the critical list.
   */
  private async alertOnCriticallyStaleDisbursements(): Promise<void> {
    const olderThan = new Date(Date.now() - CRITICAL_STALE_THRESHOLD_MS);
    let critical: StalePendingDisbursement[];
    try {
      critical = await this.disbursements.listStalePendingDisbursements(olderThan);
    } catch (error) {
      this.logger.error('Failed to list critically stale pending disbursements', error as Error);
      return;
    }

    const criticalIds = new Set(critical.map((item) => item.id));
    for (const id of this.alertedStuckPayslipIds) {
      if (!criticalIds.has(id)) {
        this.alertedStuckPayslipIds.delete(id);
      }
    }

    for (const item of critical) {
      if (this.alertedStuckPayslipIds.has(item.id)) {
        continue;
      }
      try {
        const payslip = await this.payslips.findById(item.tenantId, item.id);
        if (payslip) {
          await this.notifyOfStuckDisbursement(payslip);
        }
        this.alertedStuckPayslipIds.add(item.id);
      } catch (error) {
        this.logger.error(`Failed to alert on critically stale disbursement for payslip "${item.id}"`, error as Error);
      }
    }
  }

  /**
   * Shared by both entry points above. Re-reads the payslip fresh by
   * reference right before acting (rather than trusting a value read
   * earlier) so a webhook delivery racing a reconciliation sweep for the
   * same payslip can only resolve it once - idempotency check, same
   * posture as InvoiceService.handlePaystackWebhook's.
   */
  private async resolveIfPending(
    reference: string,
    status: typeof PayslipDisbursementStatus.SUCCESS | typeof PayslipDisbursementStatus.FAILED,
  ): Promise<void> {
    const payslip = await this.disbursements.findPayslipByPaystackTransferReference(reference);
    if (!payslip || payslip.disbursementStatus !== PayslipDisbursementStatus.PENDING) {
      return;
    }

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
    await this.emitDisbursementEvent(payslip, PAYROLL_DISBURSEMENT_FAILED_EVENT);
  }

  private async notifyOfStuckDisbursement(payslip: Payslip): Promise<void> {
    await this.emitDisbursementEvent(payslip, PAYROLL_DISBURSEMENT_STUCK_EVENT);
  }

  private async emitDisbursementEvent(payslip: Payslip, eventName: string): Promise<void> {
    const [payRun, employee] = await Promise.all([
      this.payRuns.findById(payslip.tenantId, payslip.payRunId),
      this.employees.findById(payslip.tenantId, payslip.employeeId),
    ]);
    if (!payRun || !employee) {
      return;
    }

    // buildDisbursementFailedEvent just assembles {tenantId, employeeName,
    // periodStart, periodEnd} - the same shape both events need, "Failed"
    // in its name notwithstanding (kept as-is since PayRunService also
    // calls it directly).
    this.eventEmitter.emit(eventName, buildDisbursementFailedEvent(payslip.tenantId, employee, payRun));
  }
}
