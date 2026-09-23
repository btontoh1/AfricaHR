import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from './finance.service';

/**
 * Consumes the event CustomerInvoiceService emits on every status
 * transition. Lives here, not in invoicing-feature, same decoupling
 * reasoning as PayrollGlPostingListener - the event name and payload shape
 * below must match libs/invoicing/feature/src/lib/customer-invoice.service.ts's
 * CUSTOMER_INVOICE_STATUS_CHANGED_EVENT literally.
 */
export interface CustomerInvoiceStatusChangedEventPayload {
  tenantId: string;
  organizationId: string;
  invoiceId: string;
  fromStatus: string;
  toStatus: string;
  /** ISO timestamp of the transition (sentAt/paidAt). */
  entryDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

@Injectable()
export class InvoicingGlPostingListener {
  private readonly logger = new Logger(InvoicingGlPostingListener.name);

  constructor(private readonly finance: FinanceService) {}

  @OnEvent('invoicing.customer_invoice.status_changed')
  async handleStatusChanged(payload: CustomerInvoiceStatusChangedEventPayload): Promise<void> {
    // Only SENT/PAID have a posting rule - DRAFT/OVERDUE/CANCELLED don't
    // move money or create a receivable/revenue event on their own.
    if (payload.toStatus !== 'SENT' && payload.toStatus !== 'PAID') {
      return;
    }
    try {
      const input = {
        organizationId: payload.organizationId,
        invoiceId: payload.invoiceId,
        entryDate: new Date(payload.entryDate),
        currency: payload.currency,
        subtotal: payload.subtotal,
        taxAmount: payload.taxAmount,
        total: payload.total,
      };
      if (payload.toStatus === 'SENT') {
        await this.finance.postInvoiceSent(payload.tenantId, input);
      } else {
        await this.finance.postInvoicePaid(payload.tenantId, input);
      }
    } catch (error) {
      this.logger.error(
        `Failed to post GL entry for invoice "${payload.invoiceId}" transitioning to ${payload.toStatus}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
