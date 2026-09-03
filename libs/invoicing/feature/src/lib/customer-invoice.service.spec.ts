import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { CustomerInvoiceRepository, CustomerInvoiceWithDetails } from '@africahr/invoicing-data-access';
import { CustomerInvoiceService } from './customer-invoice.service';
import { CustomerService } from './customer.service';

describe('CustomerInvoiceService', () => {
  let service: CustomerInvoiceService;
  let invoices: jest.Mocked<CustomerInvoiceRepository>;
  let customers: jest.Mocked<CustomerService>;
  let audit: jest.Mocked<AuditService>;

  const tenantAdmin: RequestUser = {
    sub: 'user-1',
    email: 'hr@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const orgAdmin: RequestUser = {
    sub: 'user-2',
    email: 'owner@subsidiary.com',
    role: SystemRole.ORG_ADMIN,
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    iat: 1,
    exp: 2,
  };

  function makeInvoice(overrides: Partial<CustomerInvoiceWithDetails> = {}): CustomerInvoiceWithDetails {
    return {
      id: 'inv-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      customerId: 'cust-1',
      invoiceNumber: 'INV-0001',
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
      currency: 'GHS',
      status: 'DRAFT',
      notes: null,
      taxRate: new Prisma.Decimal(15),
      subtotal: new Prisma.Decimal(1000),
      taxAmount: new Prisma.Decimal(150),
      total: new Prisma.Decimal(1150),
      sentAt: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      customer: { id: 'cust-1', name: 'Acme Retail' },
      organization: { id: 'org-1', name: 'Acme Ghana' },
      lineItems: [
        {
          id: 'li-1',
          invoiceId: 'inv-1',
          tenantId: 'tenant-1',
          description: 'Consulting',
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal(1000),
          amount: new Prisma.Decimal(1000),
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
        },
      ],
      ...overrides,
    } as unknown as CustomerInvoiceWithDetails;
  }

  beforeEach(() => {
    invoices = {
      countByOrganization: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CustomerInvoiceRepository>;

    customers = {
      findCustomerOrThrow: jest.fn(),
    } as unknown as jest.Mocked<CustomerService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new CustomerInvoiceService(invoices, customers, audit);
  });

  describe('create', () => {
    const createDto = {
      organizationId: 'org-1',
      customerId: 'cust-1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      currency: 'GHS',
      taxRate: 15,
      lineItems: [{ description: 'Consulting', quantity: 1, unitPrice: 1000 }],
    };

    it('rejects an ORG_ADMIN creating an invoice for a different organization', async () => {
      await expect(
        service.create('tenant-1', { ...createDto, organizationId: 'org-2' }, orgAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(invoices.create).not.toHaveBeenCalled();
    });

    it("rejects a customerId that does not belong to the invoice's organization", async () => {
      customers.findCustomerOrThrow.mockRejectedValue(new ForbiddenException('Cannot act on a different organization'));

      await expect(service.create('tenant-1', createDto, tenantAdmin)).rejects.toThrow(ForbiddenException);
      expect(invoices.create).not.toHaveBeenCalled();
    });

    it('derives the invoice number from the organization\'s existing invoice count + 1', async () => {
      invoices.countByOrganization.mockResolvedValue(41);
      invoices.create.mockResolvedValue(makeInvoice());

      await service.create('tenant-1', createDto, tenantAdmin);

      expect(invoices.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ invoiceNumber: 'INV-0042' }),
      );
    });

    it('computes totals from the line items and tax rate before persisting', async () => {
      invoices.countByOrganization.mockResolvedValue(0);
      invoices.create.mockResolvedValue(makeInvoice());

      await service.create(
        'tenant-1',
        { ...createDto, taxRate: 15, lineItems: [{ description: 'Consulting', quantity: 2, unitPrice: 500 }] },
        tenantAdmin,
      );

      expect(invoices.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ subtotal: 1000, taxAmount: 150, total: 1150 }),
      );
    });

    it('defaults the tax rate to 0 when not provided', async () => {
      invoices.countByOrganization.mockResolvedValue(0);
      invoices.create.mockResolvedValue(makeInvoice());

      await service.create('tenant-1', { ...createDto, taxRate: undefined }, tenantAdmin);

      expect(invoices.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ taxRate: 0, taxAmount: 0, total: 1000 }),
      );
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      invoices.countByOrganization.mockResolvedValue(0);
      invoices.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk violation', { code: 'P2003', clientVersion: '6.0.0' }),
      );

      await expect(service.create('tenant-1', createDto, tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      invoices.countByOrganization.mockResolvedValue(0);
      const created = makeInvoice();
      invoices.create.mockResolvedValue(created);

      await service.create('tenant-1', createDto, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          action: 'customer_invoice.created',
          resourceType: 'CustomerInvoice',
          resourceId: created.id,
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      invoices.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it("does not reveal an invoice belonging to a different organization to an ORG_ADMIN", async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ organizationId: 'org-2' }));

      await expect(service.findById('tenant-1', 'inv-1', orgAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('serializes Decimal fields to strings in the response', async () => {
      invoices.findById.mockResolvedValue(makeInvoice());

      const result = await service.findById('tenant-1', 'inv-1', tenantAdmin);

      expect(result.subtotal).toBe('1000');
      expect(result.taxAmount).toBe('150');
      expect(result.total).toBe('1150');
      expect(result.customerName).toBe('Acme Retail');
    });
  });

  describe('list', () => {
    it("hard-scopes an ORG_ADMIN to their own organization regardless of the requested filter", async () => {
      invoices.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', orgAdmin);

      expect(invoices.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });

    it('respects the requested organization filter for a tenant-wide role', async () => {
      invoices.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', tenantAdmin);

      expect(invoices.list).toHaveBeenCalledWith('tenant-1', 'org-2');
    });
  });

  describe('update', () => {
    it('rejects editing an invoice that is not Draft', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'SENT' }));

      await expect(service.update('tenant-1', 'inv-1', { notes: 'New terms' }, tenantAdmin)).rejects.toThrow(
        ConflictException,
      );
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('recomputes totals when the tax rate changes but line items do not', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ taxRate: new Prisma.Decimal(15) }));
      invoices.update.mockResolvedValue(makeInvoice());

      await service.update('tenant-1', 'inv-1', { taxRate: 0 }, tenantAdmin);

      // Existing line items (subtotal 1000) recomputed at the new 0% rate,
      // not the invoice's stored 15% - a stale tax rate must never survive
      // a partial update.
      expect(invoices.update).toHaveBeenCalledWith(
        'tenant-1',
        'inv-1',
        expect.objectContaining({ subtotal: 1000, taxAmount: 0, total: 1000 }),
      );
    });

    it('recomputes totals from new line items when provided, keeping the existing tax rate', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ taxRate: new Prisma.Decimal(10) }));
      invoices.update.mockResolvedValue(makeInvoice());

      await service.update(
        'tenant-1',
        'inv-1',
        { lineItems: [{ description: 'Revised scope', quantity: 2, unitPrice: 300 }] },
        tenantAdmin,
      );

      expect(invoices.update).toHaveBeenCalledWith(
        'tenant-1',
        'inv-1',
        expect.objectContaining({ subtotal: 600, taxAmount: 60, total: 660 }),
      );
    });

    it('validates a replacement customerId belongs to the same organization', async () => {
      invoices.findById.mockResolvedValue(makeInvoice());
      customers.findCustomerOrThrow.mockRejectedValue(new ForbiddenException());

      await expect(
        service.update('tenant-1', 'inv-1', { customerId: 'cust-other-org' }, tenantAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('records an audit entry on success', async () => {
      invoices.findById.mockResolvedValue(makeInvoice());
      invoices.update.mockResolvedValue(makeInvoice({ notes: 'Updated' }));

      await service.update('tenant-1', 'inv-1', { notes: 'Updated' }, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer_invoice.updated', resourceId: 'inv-1' }),
      );
    });
  });

  describe('updateStatus', () => {
    it('rejects an invalid transition (e.g. Draft straight to Paid)', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await expect(service.updateStatus('tenant-1', 'inv-1', 'PAID', tenantAdmin)).rejects.toThrow(Error);
      expect(invoices.updateStatus).not.toHaveBeenCalled();
    });

    it('sets sentAt when transitioning Draft -> Sent', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await service.updateStatus('tenant-1', 'inv-1', 'SENT', tenantAdmin);

      expect(invoices.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'inv-1',
        'SENT',
        expect.objectContaining({ sentAt: expect.any(Date), paidAt: undefined }),
      );
    });

    it('sets paidAt when transitioning Sent -> Paid', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'SENT' }));

      await service.updateStatus('tenant-1', 'inv-1', 'PAID', tenantAdmin);

      expect(invoices.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'inv-1',
        'PAID',
        expect.objectContaining({ paidAt: expect.any(Date), sentAt: undefined }),
      );
    });

    it('rejects any transition out of a terminal Paid invoice', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'PAID' }));

      await expect(service.updateStatus('tenant-1', 'inv-1', 'CANCELLED', tenantAdmin)).rejects.toThrow(Error);
      expect(invoices.updateStatus).not.toHaveBeenCalled();
    });

    it('records an audit entry capturing the from/to status', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await service.updateStatus('tenant-1', 'inv-1', 'SENT', tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'customer_invoice.status_changed',
          resourceId: 'inv-1',
          metadata: { from: 'DRAFT', to: 'SENT' },
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('rejects deleting an invoice that is not Draft', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'SENT' }));

      await expect(service.softDelete('tenant-1', 'inv-1', tenantAdmin)).rejects.toThrow(ConflictException);
      expect(invoices.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes a Draft invoice and audits on success', async () => {
      invoices.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await service.softDelete('tenant-1', 'inv-1', tenantAdmin);

      expect(invoices.softDelete).toHaveBeenCalledWith('tenant-1', 'inv-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer_invoice.deleted', resourceId: 'inv-1' }),
      );
    });
  });
});
