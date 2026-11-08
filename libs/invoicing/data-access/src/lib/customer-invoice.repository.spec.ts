import { PrismaService } from '@africahr/platform-database';
import { CustomerInvoiceRepository } from './customer-invoice.repository';

describe('CustomerInvoiceRepository', () => {
  let repository: CustomerInvoiceRepository;
  let tx: {
    customerInvoice: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
    customerInvoiceLineItem: { deleteMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      customerInvoice: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      customerInvoiceLineItem: { deleteMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new CustomerInvoiceRepository(prisma as unknown as PrismaService);
  });

  describe('countByOrganization', () => {
    it('counts every invoice for the organization, including soft-deleted ones', async () => {
      await repository.countByOrganization('tenant-1', 'org-1');

      // No deletedAt filter here - a deleted draft's number must never be
      // reused (see the method's own doc comment).
      expect(tx.customerInvoice.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
      });
    });
  });

  describe('create', () => {
    it('creates the invoice with its line items in one nested write', async () => {
      const issueDate = new Date('2026-01-01');
      const dueDate = new Date('2026-01-31');

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        customerId: 'cust-1',
        invoiceNumber: 'INV-0001',
        issueDate,
        dueDate,
        currency: 'GHS',
        taxRate: 15,
        subtotal: 1000,
        taxAmount: 150,
        total: 1150,
        lineItems: [{ description: 'Consulting', quantity: 1, unitPrice: 1000, amount: 1000, sortOrder: 0 }],
        createdBy: 'user-1',
      });

      expect(tx.customerInvoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          customerId: 'cust-1',
          invoiceNumber: 'INV-0001',
          issueDate,
          dueDate,
          currency: 'GHS',
          taxRate: 15,
          subtotal: 1000,
          taxAmount: 150,
          total: 1150,
          createdBy: 'user-1',
          updatedBy: 'user-1',
          lineItems: {
            create: [
              expect.objectContaining({
                tenantId: 'tenant-1',
                description: 'Consulting',
                quantity: 1,
                unitPrice: 1000,
                amount: 1000,
                sortOrder: 0,
                createdBy: 'user-1',
              }),
            ],
          },
        }),
        include: { lineItems: true, customer: true, organization: true },
      });
    });
  });

  describe('findById', () => {
    it('scopes to the tenant, excludes soft-deleted rows, and orders line items', async () => {
      await repository.findById('tenant-1', 'inv-1');

      expect(tx.customerInvoice.findFirst).toHaveBeenCalledWith({
        where: { id: 'inv-1', tenantId: 'tenant-1', deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
      });
    });
  });

  describe('list', () => {
    it('lists invoices scoped to the tenant and organization, most recent issue date first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.customerInvoice.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
        orderBy: { issueDate: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('deletes and recreates line items when a new set is provided', async () => {
      await repository.update('tenant-1', 'inv-1', {
        lineItems: [{ description: 'Revised scope', quantity: 2, unitPrice: 500, amount: 1000, sortOrder: 0 }],
        updatedBy: 'user-1',
      });

      expect(tx.customerInvoiceLineItem.deleteMany).toHaveBeenCalledWith({ where: { invoiceId: 'inv-1' } });
      expect(tx.customerInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          lineItems: {
            create: [
              expect.objectContaining({
                tenantId: 'tenant-1',
                description: 'Revised scope',
                quantity: 2,
                unitPrice: 500,
                amount: 1000,
                sortOrder: 0,
                createdBy: 'user-1',
              }),
            ],
          },
        }),
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
      });
    });

    it('leaves existing line items untouched when none are provided', async () => {
      await repository.update('tenant-1', 'inv-1', { notes: 'Updated terms', updatedBy: 'user-1' });

      expect(tx.customerInvoiceLineItem.deleteMany).not.toHaveBeenCalled();
      expect(tx.customerInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ notes: 'Updated terms', lineItems: undefined }),
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
      });
    });
  });

  describe('updateStatus', () => {
    it('sets sentAt when transitioning to SENT', async () => {
      const sentAt = new Date('2026-01-05');

      await repository.updateStatus('tenant-1', 'inv-1', 'SENT', { sentAt, updatedBy: 'user-1' });

      expect(tx.customerInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'SENT', sentAt, paidAt: undefined, updatedBy: 'user-1' },
      });
    });

    it('sets paidAt when transitioning to PAID', async () => {
      const paidAt = new Date('2026-02-01');

      await repository.updateStatus('tenant-1', 'inv-1', 'PAID', { paidAt, updatedBy: 'user-1' });

      expect(tx.customerInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'PAID', sentAt: undefined, paidAt, updatedBy: 'user-1' },
      });
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt instead of removing the row', async () => {
      await repository.softDelete('tenant-1', 'inv-1', 'user-1');

      expect(tx.customerInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
      });
    });
  });
});
