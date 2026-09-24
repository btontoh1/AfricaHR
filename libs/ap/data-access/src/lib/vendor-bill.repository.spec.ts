import { PrismaService } from '@africahr/platform-database';
import { VendorBillRepository } from './vendor-bill.repository';

describe('VendorBillRepository', () => {
  let repository: VendorBillRepository;
  let tx: {
    vendorBill: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
    vendorBillLineItem: { deleteMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      vendorBill: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      vendorBillLineItem: { deleteMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new VendorBillRepository(prisma as unknown as PrismaService);
  });

  describe('countByOrganization', () => {
    it('counts every bill for the organization, including soft-deleted ones', async () => {
      await repository.countByOrganization('tenant-1', 'org-1');

      expect(tx.vendorBill.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
      });
    });
  });

  describe('create', () => {
    it('creates the bill with its line items in one nested write', async () => {
      const billDate = new Date('2026-01-01');
      const dueDate = new Date('2026-01-31');

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        vendorId: 'vendor-1',
        billNumber: 'BILL-0001',
        billDate,
        dueDate,
        currency: 'GHS',
        taxRate: 15,
        subtotal: 1000,
        taxAmount: 150,
        total: 1150,
        lineItems: [{ description: 'Office supplies', quantity: 1, unitPrice: 1000, amount: 1000, sortOrder: 0 }],
        createdBy: 'user-1',
      });

      expect(tx.vendorBill.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          vendorId: 'vendor-1',
          billNumber: 'BILL-0001',
          billDate,
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
                description: 'Office supplies',
                quantity: 1,
                unitPrice: 1000,
                amount: 1000,
                sortOrder: 0,
                createdBy: 'user-1',
              }),
            ],
          },
        }),
        include: { lineItems: true, vendor: true, organization: true },
      });
    });
  });

  describe('findById', () => {
    it('scopes to the tenant, excludes soft-deleted rows, and orders line items', async () => {
      await repository.findById('tenant-1', 'bill-1');

      expect(tx.vendorBill.findFirst).toHaveBeenCalledWith({
        where: { id: 'bill-1', tenantId: 'tenant-1', deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      });
    });
  });

  describe('list', () => {
    it('lists bills scoped to the tenant and organization, most recent bill date first', async () => {
      await repository.list('tenant-1', 'org-1');

      expect(tx.vendorBill.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
        orderBy: { billDate: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('deletes and recreates line items when a new set is provided', async () => {
      await repository.update('tenant-1', 'bill-1', {
        lineItems: [{ description: 'Revised scope', quantity: 2, unitPrice: 500, amount: 1000, sortOrder: 0 }],
        updatedBy: 'user-1',
      });

      expect(tx.vendorBillLineItem.deleteMany).toHaveBeenCalledWith({ where: { billId: 'bill-1' } });
      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
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
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      });
    });

    it('leaves existing line items untouched when none are provided', async () => {
      await repository.update('tenant-1', 'bill-1', { notes: 'Updated terms', updatedBy: 'user-1' });

      expect(tx.vendorBillLineItem.deleteMany).not.toHaveBeenCalled();
      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: expect.objectContaining({ notes: 'Updated terms', lineItems: undefined }),
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      });
    });
  });

  describe('updateStatus', () => {
    it('sets approvedAt when transitioning to APPROVED', async () => {
      const approvedAt = new Date('2026-01-05');

      await repository.updateStatus('tenant-1', 'bill-1', 'APPROVED', { approvedAt, updatedBy: 'user-1' });

      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: 'APPROVED', approvedAt, paidAt: undefined, updatedBy: 'user-1' },
      });
    });

    it('sets paidAt when transitioning to PAID', async () => {
      const paidAt = new Date('2026-02-01');

      await repository.updateStatus('tenant-1', 'bill-1', 'PAID', { paidAt, updatedBy: 'user-1' });

      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: 'PAID', approvedAt: undefined, paidAt, updatedBy: 'user-1' },
      });
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt instead of removing the row', async () => {
      await repository.softDelete('tenant-1', 'bill-1', 'user-1');

      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
      });
    });
  });
});
