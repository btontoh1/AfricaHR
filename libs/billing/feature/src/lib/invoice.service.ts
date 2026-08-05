import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BillingEmployeeCountRepository,
  BillingTenantContactRepository,
  InvoiceRepository,
  PlatformBillingRepository,
  SubscriptionRepository,
} from '@africahr/billing-data-access';
import { calculateInvoiceAmount, nextBillingPeriod } from '@africahr/billing-domain';
import { PaystackClient } from './paystack-client';

interface PaystackWebhookPayload {
  event: string;
  data?: { reference?: string };
}

/**
 * Emitted when this webhook endpoint sees a transfer.success/
 * transfer.failed/transfer.reversed event - payroll payout events, not
 * billing's own concern. Paystack allows only one webhook URL per
 * account, and this endpoint (PaystackWebhookController) already owns
 * it, so every Paystack event this app cares about arrives here
 * regardless of domain. scope:billing cannot depend on scope:payroll
 * (Nx module boundary) to hand this off directly, so it's re-emitted as
 * an internal event instead - payroll-feature's
 * PayrollTransferWebhookListener consumes it. Both sides must agree on
 * this literal string and payload shape informally; there's no shared
 * type between scopes for it.
 */
export const PAYSTACK_TRANSFER_UPDATED_EVENT = 'payroll.paystack_transfer.updated';

export interface PaystackTransferUpdatedEvent {
  reference: string;
  status: 'success' | 'failed';
}

const TRANSFER_EVENT_STATUS: Record<string, 'success' | 'failed'> = {
  'transfer.success': 'success',
  'transfer.failed': 'failed',
  'transfer.reversed': 'failed',
};

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly subscriptions: SubscriptionRepository,
    private readonly employeeCounts: BillingEmployeeCountRepository,
    private readonly tenantContacts: BillingTenantContactRepository,
    private readonly platformBilling: PlatformBillingRepository,
    private readonly paystack: PaystackClient,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async generate(tenantId: string, actorId?: string): Promise<Invoice> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      throw new NotFoundException(`Tenant "${tenantId}" has no subscription`);
    }
    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException(`Tenant "${tenantId}" has no active subscription to invoice`);
    }

    // A tenant's billing period only advances once its invoice is paid
    // (see advanceSubscriptionPeriod), so a second generate() call before
    // that happens would otherwise create a second invoice for the exact
    // same period - checked before the Paystack call so a duplicate click
    // doesn't also mint a second checkout transaction.
    const existingPending = await this.invoices.findPendingForTenant(tenantId);
    if (existingPending) {
      throw new ConflictException(
        `Tenant "${tenantId}" already has a pending invoice (${existingPending.id}) - cancel it before generating another`,
      );
    }

    const employeeCount = await this.employeeCounts.countActive(tenantId);
    const amount = calculateInvoiceAmount(subscription.pricePerEmployee.toNumber(), employeeCount);
    const adminEmail = await this.tenantContacts.findAdminEmail(tenantId);
    if (!adminEmail) {
      throw new BadRequestException(`Tenant "${tenantId}" has no active tenant admin to bill`);
    }

    const reference = randomUUID();
    const checkout = await this.paystack.initializeTransaction({
      email: adminEmail,
      amount,
      currency: subscription.currency,
      reference,
      metadata: { tenantId, subscriptionId: subscription.id },
    });

    const invoice = await this.invoices.create({
      tenantId,
      subscriptionId: subscription.id,
      amount,
      currency: subscription.currency,
      employeeCountAtIssue: employeeCount,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: subscription.currentPeriodEnd,
      paystackReference: checkout.reference,
      checkoutUrl: checkout.authorizationUrl,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.invoice.generated',
      resourceType: 'Invoice',
      resourceId: invoice.id,
    });

    return invoice;
  }

  listForTenant(tenantId: string): Promise<Invoice[]> {
    return this.invoices.listByTenant(tenantId);
  }

  /**
   * Voids a mistakenly-generated invoice (e.g. a duplicate from clicking
   * generate twice) so it stops appearing as something the tenant owes.
   * Only PENDING invoices can be cancelled - a PAID one already collected
   * real money and needs an actual refund, not a status flip, and a
   * CANCELLED one is already cancelled.
   */
  async cancel(tenantId: string, invoiceId: string, actorId?: string): Promise<Invoice> {
    const invoice = await this.invoices.findById(tenantId, invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceId}" not found`);
    }
    if (invoice.status !== 'PENDING') {
      throw new ConflictException(`Cannot cancel a ${invoice.status} invoice`);
    }

    const cancelled = await this.invoices.update(tenantId, invoiceId, {
      status: 'CANCELLED',
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.invoice.cancelled',
      resourceType: 'Invoice',
      resourceId: invoiceId,
    });

    return cancelled;
  }

  /** Manual fallback for reconciling a payment collected outside Paystack (e.g. bank transfer), not the primary path. */
  async markPaidManually(tenantId: string, invoiceId: string, actorId?: string): Promise<Invoice> {
    const invoice = await this.invoices.findById(tenantId, invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceId}" not found`);
    }

    const paid = await this.invoices.update(tenantId, invoiceId, {
      status: 'PAID',
      paidAt: new Date(),
      updatedBy: actorId,
    });

    await this.advanceSubscriptionPeriod(tenantId, invoice.subscriptionId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.invoice.marked_paid_manually',
      resourceType: 'Invoice',
      resourceId: invoiceId,
    });

    return paid;
  }

  /**
   * Verifies the Paystack webhook signature against the *raw* request body
   * (see PaystackClient.verifyWebhookSignature) - this is the only
   * Paystack webhook endpoint in the app (Paystack allows just one per
   * account), so it dispatches by event type: charge.success marks the
   * matching invoice paid and rolls its subscription's billing period
   * forward; transfer.success/transfer.failed/transfer.reversed (payroll
   * payouts, not this service's own concern) are re-emitted as
   * PaystackTransferUpdatedEvent for payroll-feature to consume - see
   * that event's doc comment for why. Anything else it doesn't recognize
   * (a different event type, an already-paid or unknown reference) is
   * silently ignored rather than erroring — Paystack retries webhooks
   * that respond with a non-2xx status, and a duplicate delivery isn't a
   * failure.
   */
  async handlePaystackWebhook(
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<void> {
    if (!this.paystack.verifyWebhookSignature(rawBody, signatureHeader)) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
    const reference = payload.data?.reference;

    const transferStatus = TRANSFER_EVENT_STATUS[payload.event];
    if (transferStatus && reference) {
      const event: PaystackTransferUpdatedEvent = { reference, status: transferStatus };
      this.eventEmitter.emit(PAYSTACK_TRANSFER_UPDATED_EVENT, event);
      return;
    }

    if (payload.event !== 'charge.success' || !reference) {
      return;
    }

    const invoice = await this.platformBilling.findInvoiceByPaystackReference(reference);
    if (!invoice || invoice.status === 'PAID') {
      return;
    }

    await this.invoices.update(invoice.tenantId, invoice.id, {
      status: 'PAID',
      paidAt: new Date(),
    });

    await this.advanceSubscriptionPeriod(invoice.tenantId, invoice.subscriptionId);

    await this.audit.record({
      tenantId: invoice.tenantId,
      actorUserId: null,
      action: 'billing.invoice.paid',
      resourceType: 'Invoice',
      resourceId: invoice.id,
    });
  }

  private async advanceSubscriptionPeriod(tenantId: string, subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription || subscription.id !== subscriptionId) {
      return;
    }
    const { start, end } = nextBillingPeriod(subscription.currentPeriodEnd);
    await this.subscriptions.update(tenantId, subscriptionId, {
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });
  }
}
