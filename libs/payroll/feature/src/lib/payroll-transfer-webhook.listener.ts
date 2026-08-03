import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PayslipDisbursementStatus } from '@prisma/client';
import { PayrollDisbursementRepository, PayslipRepository } from '@africahr/payroll-data-access';

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

@Injectable()
export class PayrollTransferWebhookListener {
  private readonly logger = new Logger(PayrollTransferWebhookListener.name);

  constructor(
    private readonly disbursements: PayrollDisbursementRepository,
    private readonly payslips: PayslipRepository,
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

    try {
      await this.payslips.recordDisbursementResult(payslip.tenantId, payslip.id, status);
    } catch (error) {
      this.logger.error(`Failed to record disbursement result for payslip "${payslip.id}"`, error as Error);
    }
  }
}
