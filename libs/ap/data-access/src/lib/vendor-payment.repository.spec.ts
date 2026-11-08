import { PrismaService } from '@africahr/platform-database';
import { VendorPaymentRepository } from './vendor-payment.repository';

describe('VendorPaymentRepository', () => {
  let repository: VendorPaymentRepository;
  let tx: {
    vendorPayment: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock };
    vendorBill: { update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      vendorPayment: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
      vendorBill: { update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new VendorPaymentRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates the payment with nested allocations, then updates every allocated bill', async () => {
      const paymentDate = new Date('2026-04-01');
      tx.vendorPayment.create.mockResolvedValue({ id: 'payment-1' });

      await repository.create('tenant-1', {
        organizationId: 'org-1',
        vendorId: 'vendor-1',
        paymentDate,
        currency: 'GHS',
        amount: 1500,
        method: 'BANK_TRANSFER',
        reference: 'TXN-001',
        notes: 'Partial + full settlement',
        allocations: [
          { billId: 'bill-1', amount: 1000 },
          { billId: 'bill-2', amount: 500 },
        ],
        billUpdates: [
          { billId: 'bill-1', amountPaid: 1000, status: 'PAID', paidAt: paymentDate },
          { billId: 'bill-2', amountPaid: 500, status: 'PARTIALLY_PAID' },
        ],
        createdBy: 'user-1',
      });

      expect(tx.vendorPayment.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          vendorId: 'vendor-1',
          paymentDate,
          currency: 'GHS',
          amount: 1500,
          method: 'BANK_TRANSFER',
          reference: 'TXN-001',
          notes: 'Partial + full settlement',
          createdBy: 'user-1',
          allocations: {
            create: [
              { tenantId: 'tenant-1', billId: 'bill-1', amount: 1000 },
              { tenantId: 'tenant-1', billId: 'bill-2', amount: 500 },
            ],
          },
        },
        include: { vendor: true, allocations: { include: { bill: true } } },
      });
      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { amountPaid: 1000, status: 'PAID', paidAt: paymentDate },
      });
      expect(tx.vendorBill.update).toHaveBeenCalledWith({
        where: { id: 'bill-2' },
        data: { amountPaid: 500, status: 'PARTIALLY_PAID', paidAt: undefined },
      });
    });
  });

  describe('findById', () => {
    it('finds a payment scoped to the tenant, including allocations and their bills', async () => {
      await repository.findById('tenant-1', 'payment-1');

      expect(tx.vendorPayment.findFirst).toHaveBeenCalledWith({
        where: { id: 'payment-1', tenantId: 'tenant-1' },
        include: { vendor: true, allocations: { include: { bill: true } } },
      });
    });
  });

  describe('list', () => {
    it('lists payments scoped to the tenant/organization/vendor, most recent first', async () => {
      await repository.list('tenant-1', 'org-1', 'vendor-1');

      expect(tx.vendorPayment.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1', vendorId: 'vendor-1' },
        include: { vendor: true, allocations: { include: { bill: true } } },
        orderBy: { paymentDate: 'desc' },
      });
    });
  });
});
