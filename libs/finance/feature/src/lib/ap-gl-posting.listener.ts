import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from './finance.service';

/**
 * Consumes the event VendorBillService emits on every status transition.
 * Lives here, not in ap-feature, same decoupling reasoning as
 * InvoicingGlPostingListener - the event name and payload shape below must
 * match libs/ap/feature/src/lib/vendor-bill.service.ts's
 * VENDOR_BILL_STATUS_CHANGED_EVENT literally.
 */
export interface VendorBillStatusChangedEventPayload {
  tenantId: string;
  organizationId: string;
  billId: string;
  fromStatus: string;
  toStatus: string;
  /** ISO timestamp of the transition (approvedAt/paidAt). */
  entryDate: string;
  currency: string;
  total: number;
}

@Injectable()
export class ApGlPostingListener {
  private readonly logger = new Logger(ApGlPostingListener.name);

  constructor(private readonly finance: FinanceService) {}

  @OnEvent('ap.vendor_bill.status_changed')
  async handleStatusChanged(payload: VendorBillStatusChangedEventPayload): Promise<void> {
    // Only APPROVED/PAID have a posting rule - DRAFT/OVERDUE/CANCELLED don't
    // move money or create a payable/expense event on their own.
    if (payload.toStatus !== 'APPROVED' && payload.toStatus !== 'PAID') {
      return;
    }
    try {
      const input = {
        organizationId: payload.organizationId,
        billId: payload.billId,
        entryDate: new Date(payload.entryDate),
        currency: payload.currency,
        total: payload.total,
      };
      if (payload.toStatus === 'APPROVED') {
        await this.finance.postVendorBillApproved(payload.tenantId, input);
      } else {
        await this.finance.postVendorBillPaid(payload.tenantId, input);
      }
    } catch (error) {
      this.logger.error(
        `Failed to post GL entry for vendor bill "${payload.billId}" transitioning to ${payload.toStatus}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
