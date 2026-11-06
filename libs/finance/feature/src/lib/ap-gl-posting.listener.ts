import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from './finance.service';

/**
 * Consumes the event VendorBillService emits on every status transition it
 * makes itself. Lives here, not in ap-feature, same decoupling reasoning as
 * InvoicingGlPostingListener - the event name and payload shape below must
 * match libs/ap/feature/src/lib/vendor-bill.service.ts's
 * VENDOR_BILL_STATUS_CHANGED_EVENT literally. Never fired with toStatus
 * PARTIALLY_PAID/PAID - see handleVendorPaymentRecorded below.
 */
export interface VendorBillStatusChangedEventPayload {
  tenantId: string;
  organizationId: string;
  billId: string;
  /** e.g. "BILL-0001" - used only to make the journal entry's description readable. */
  billNumber: string;
  fromStatus: string;
  toStatus: string;
  /** ISO timestamp of the transition (approvedAt). */
  entryDate: string;
  currency: string;
  total: number;
}

/**
 * Consumes the event VendorPaymentService emits once per recorded payment -
 * the payload shape must match libs/ap/feature/src/lib/vendor-payment.service.ts's
 * VENDOR_PAYMENT_RECORDED_EVENT literally.
 */
export interface VendorPaymentRecordedEventPayload {
  tenantId: string;
  organizationId: string;
  paymentId: string;
  /** Used only to make the journal entry's description readable - VendorPayment has no number sequence of its own. */
  vendorName: string;
  entryDate: string;
  currency: string;
  amount: number;
}

@Injectable()
export class ApGlPostingListener {
  private readonly logger = new Logger(ApGlPostingListener.name);

  constructor(private readonly finance: FinanceService) {}

  @OnEvent('ap.vendor_bill.status_changed')
  async handleStatusChanged(payload: VendorBillStatusChangedEventPayload): Promise<void> {
    // Only APPROVED has a posting rule here - DRAFT/OVERDUE/CANCELLED don't
    // move money on their own, and PARTIALLY_PAID/PAID never reach this
    // listener at all (see VendorBillStatusChangedEventPayload's doc comment).
    if (payload.toStatus !== 'APPROVED') {
      return;
    }
    try {
      await this.finance.postVendorBillApproved(payload.tenantId, {
        organizationId: payload.organizationId,
        billId: payload.billId,
        billNumber: payload.billNumber,
        entryDate: new Date(payload.entryDate),
        currency: payload.currency,
        total: payload.total,
      });
    } catch (error) {
      this.logger.error(
        `Failed to post GL entry for vendor bill "${payload.billId}" transitioning to ${payload.toStatus}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent('ap.vendor_payment.recorded')
  async handleVendorPaymentRecorded(payload: VendorPaymentRecordedEventPayload): Promise<void> {
    try {
      await this.finance.postVendorPayment(payload.tenantId, {
        organizationId: payload.organizationId,
        paymentId: payload.paymentId,
        vendorName: payload.vendorName,
        entryDate: new Date(payload.entryDate),
        currency: payload.currency,
        amount: payload.amount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to post GL entry for vendor payment "${payload.paymentId}"`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
