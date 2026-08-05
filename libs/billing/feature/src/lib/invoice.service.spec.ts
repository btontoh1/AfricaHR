import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice, Prisma, Subscription } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BillingEmployeeCountRepository,
  BillingTenantContactRepository,
  InvoiceRepository,
  PlatformBillingRepository,
  SubscriptionRepository,
} from '@africahr/billing-data-access';
import { InvoiceService, PAYSTACK_TRANSFER_UPDATED_EVENT } from './invoice.service';
import { PaystackClient } from './paystack-client';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoices: jest.Mocked<InvoiceRepository>;
  let subscriptions: jest.Mocked<SubscriptionRepository>;
  let employeeCounts: jest.Mocked<BillingEmployeeCountRepository>;
  let tenantContacts: jest.Mocked<BillingTenantContactRepository>;
  let platformBilling: jest.Mocked<PlatformBillingRepository>;
  let paystack: jest.Mocked<PaystackClient>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const activeSubscription: Subscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    pricePerEmployee: new Prisma.Decimal(10),
    currency: 'GHS',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2026-08-01'),
    currentPeriodEnd: new Date('2026-09-01'),
    cancelAtPeriodEnd: false,
    paystackCustomerCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  const baseInvoice: Invoice = {
    id: 'inv-1',
    tenantId: 'tenant-1',
    subscriptionId: 'sub-1',
    amount: new Prisma.Decimal(200),
    currency: 'GHS',
    employeeCountAtIssue: 20,
    status: 'PENDING',
    periodStart: new Date('2026-08-01'),
    periodEnd: new Date('2026-09-01'),
    dueDate: new Date('2026-09-01'),
    paidAt: null,
    paystackReference: 'ref-123',
    checkoutUrl: 'https://checkout.paystack.com/abc',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    invoices = {
      create: jest.fn(),
      listByTenant: jest.fn(),
      findById: jest.fn(),
      findPendingForTenant: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<InvoiceRepository>;

    subscriptions = {
      findByTenant: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepository>;

    employeeCounts = { countActive: jest.fn() } as unknown as jest.Mocked<BillingEmployeeCountRepository>;
    tenantContacts = { findAdminEmail: jest.fn() } as unknown as jest.Mocked<BillingTenantContactRepository>;
    platformBilling = {
      findInvoiceByPaystackReference: jest.fn(),
    } as unknown as jest.Mocked<PlatformBillingRepository>;
    paystack = {
      initializeTransaction: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    } as unknown as jest.Mocked<PaystackClient>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new InvoiceService(
      invoices,
      subscriptions,
      employeeCounts,
      tenantContacts,
      platformBilling,
      paystack,
      audit,
      eventEmitter,
    );
  });

  describe('generate', () => {
    it('creates a Paystack checkout and an invoice for the current headcount', async () => {
      subscriptions.findByTenant.mockResolvedValue(activeSubscription);
      invoices.findPendingForTenant.mockResolvedValue(null);
      employeeCounts.countActive.mockResolvedValue(20);
      tenantContacts.findAdminEmail.mockResolvedValue('admin@acme.com');
      paystack.initializeTransaction.mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/abc',
        accessCode: 'code',
        reference: 'ref-123',
      });
      invoices.create.mockResolvedValue(baseInvoice);

      const result = await service.generate('tenant-1', 'admin-1');

      expect(result).toBe(baseInvoice);
      expect(paystack.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@acme.com', amount: 200, currency: 'GHS' }),
      );
      expect(invoices.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', amount: 200, employeeCountAtIssue: 20 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.invoice.generated' }),
      );
    });

    it('rejects generating an invoice for a tenant with no subscription', async () => {
      subscriptions.findByTenant.mockResolvedValue(null);

      await expect(service.generate('tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('rejects generating an invoice for a cancelled subscription', async () => {
      subscriptions.findByTenant.mockResolvedValue({ ...activeSubscription, status: 'CANCELLED' });

      await expect(service.generate('tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects generating an invoice when the tenant has no active admin to bill', async () => {
      subscriptions.findByTenant.mockResolvedValue(activeSubscription);
      invoices.findPendingForTenant.mockResolvedValue(null);
      employeeCounts.countActive.mockResolvedValue(20);
      tenantContacts.findAdminEmail.mockResolvedValue(null);

      await expect(service.generate('tenant-1')).rejects.toThrow(BadRequestException);
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
    });

    it('rejects generating a second invoice while one is already pending', async () => {
      subscriptions.findByTenant.mockResolvedValue(activeSubscription);
      invoices.findPendingForTenant.mockResolvedValue(baseInvoice);

      await expect(service.generate('tenant-1')).rejects.toThrow(ConflictException);
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
      expect(invoices.create).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels a PENDING invoice and audits it', async () => {
      invoices.findById.mockResolvedValue(baseInvoice);
      invoices.update.mockResolvedValue({ ...baseInvoice, status: 'CANCELLED' });

      const result = await service.cancel('tenant-1', 'inv-1', 'admin-1');

      expect(invoices.update).toHaveBeenCalledWith('tenant-1', 'inv-1', {
        status: 'CANCELLED',
        updatedBy: 'admin-1',
      });
      expect(result.status).toBe('CANCELLED');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.invoice.cancelled', resourceId: 'inv-1' }),
      );
    });

    it('throws when the invoice does not exist', async () => {
      invoices.findById.mockResolvedValue(null);

      await expect(service.cancel('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling an already-PAID invoice', async () => {
      invoices.findById.mockResolvedValue({ ...baseInvoice, status: 'PAID' });

      await expect(service.cancel('tenant-1', 'inv-1')).rejects.toThrow(ConflictException);
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling an already-CANCELLED invoice', async () => {
      invoices.findById.mockResolvedValue({ ...baseInvoice, status: 'CANCELLED' });

      await expect(service.cancel('tenant-1', 'inv-1')).rejects.toThrow(ConflictException);
      expect(invoices.update).not.toHaveBeenCalled();
    });
  });

  describe('markPaidManually', () => {
    it('marks the invoice paid and rolls the subscription period forward', async () => {
      invoices.findById.mockResolvedValue(baseInvoice);
      invoices.update.mockResolvedValue({ ...baseInvoice, status: 'PAID' });
      subscriptions.findByTenant.mockResolvedValue(activeSubscription);

      const result = await service.markPaidManually('tenant-1', 'inv-1', 'admin-1');

      expect(result.status).toBe('PAID');
      expect(subscriptions.update).toHaveBeenCalledWith('tenant-1', 'sub-1', {
        currentPeriodStart: new Date('2026-09-01'),
        currentPeriodEnd: new Date('2026-10-01'),
      });
    });

    it('throws when the invoice does not exist', async () => {
      invoices.findById.mockResolvedValue(null);

      await expect(service.markPaidManually('tenant-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handlePaystackWebhook', () => {
    it('rejects a webhook with an invalid signature', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(false);

      await expect(service.handlePaystackWebhook('{}', 'bad-signature')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('marks the matching invoice paid on a successful charge', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);
      platformBilling.findInvoiceByPaystackReference.mockResolvedValue({
        id: 'inv-1',
        tenantId: 'tenant-1',
        subscriptionId: 'sub-1',
        amount: 200,
        currency: 'GHS',
        employeeCountAtIssue: 20,
        status: 'PENDING',
        periodStart: activeSubscription.currentPeriodStart,
        periodEnd: activeSubscription.currentPeriodEnd,
        dueDate: activeSubscription.currentPeriodEnd,
        paidAt: null,
        paystackReference: 'ref-123',
        checkoutUrl: 'https://checkout.paystack.com/abc',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      subscriptions.findByTenant.mockResolvedValue(activeSubscription);

      const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'ref-123' } });
      await service.handlePaystackWebhook(rawBody, 'valid-signature');

      expect(invoices.update).toHaveBeenCalledWith(
        'tenant-1',
        'inv-1',
        expect.objectContaining({ status: 'PAID' }),
      );
      expect(subscriptions.update).toHaveBeenCalledWith('tenant-1', 'sub-1', {
        currentPeriodStart: new Date('2026-09-01'),
        currentPeriodEnd: new Date('2026-10-01'),
      });
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'billing.invoice.paid' }));
    });

    it('ignores events that are not a successful charge', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);

      await service.handlePaystackWebhook(
        JSON.stringify({ event: 'charge.failed', data: { reference: 'ref-123' } }),
        'valid-signature',
      );

      expect(platformBilling.findInvoiceByPaystackReference).not.toHaveBeenCalled();
    });

    it('ignores a reference that does not match any invoice', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);
      platformBilling.findInvoiceByPaystackReference.mockResolvedValue(null);

      await service.handlePaystackWebhook(
        JSON.stringify({ event: 'charge.success', data: { reference: 'unknown' } }),
        'valid-signature',
      );

      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('re-emits a transfer.success event instead of handling it as billing', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);

      await service.handlePaystackWebhook(
        JSON.stringify({ event: 'transfer.success', data: { reference: 'ref-456' } }),
        'valid-signature',
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(PAYSTACK_TRANSFER_UPDATED_EVENT, {
        reference: 'ref-456',
        status: 'success',
      });
      expect(platformBilling.findInvoiceByPaystackReference).not.toHaveBeenCalled();
    });

    it('re-emits a transfer.failed event as a failed status', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);

      await service.handlePaystackWebhook(
        JSON.stringify({ event: 'transfer.failed', data: { reference: 'ref-456' } }),
        'valid-signature',
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(PAYSTACK_TRANSFER_UPDATED_EVENT, {
        reference: 'ref-456',
        status: 'failed',
      });
    });

    it('re-emits a transfer.reversed event as a failed status', async () => {
      paystack.verifyWebhookSignature.mockReturnValue(true);

      await service.handlePaystackWebhook(
        JSON.stringify({ event: 'transfer.reversed', data: { reference: 'ref-456' } }),
        'valid-signature',
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(PAYSTACK_TRANSFER_UPDATED_EVENT, {
        reference: 'ref-456',
        status: 'failed',
      });
    });
  });
});
