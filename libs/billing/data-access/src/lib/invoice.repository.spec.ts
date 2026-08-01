import { PrismaService } from '@africahr/platform-database';
import { InvoiceRepository } from './invoice.repository';

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;
  let tx: {
    invoice: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      invoice: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InvoiceRepository(prisma as unknown as PrismaService);
  });

  it('creates an invoice scoped to the tenant', async () => {
    tx.invoice.create.mockResolvedValue({ id: 'inv-1' });
    const periodStart = new Date('2026-08-01');
    const periodEnd = new Date('2026-09-01');
    const dueDate = new Date('2026-08-08');

    const result = await repository.create({
      tenantId: 'tenant-1',
      subscriptionId: 'sub-1',
      amount: 500,
      currency: 'GHS',
      employeeCountAtIssue: 50,
      periodStart,
      periodEnd,
      dueDate,
      createdBy: 'admin-1',
    });

    expect(result).toEqual({ id: 'inv-1' });
    expect(tx.invoice.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        subscriptionId: 'sub-1',
        amount: 500,
        currency: 'GHS',
        employeeCountAtIssue: 50,
        periodStart,
        periodEnd,
        dueDate,
        paystackReference: undefined,
        checkoutUrl: undefined,
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
      },
    });
  });

  it('lists invoices for a tenant, newest first', async () => {
    tx.invoice.findMany.mockResolvedValue([{ id: 'inv-1' }]);

    const result = await repository.listByTenant('tenant-1');

    expect(result).toEqual([{ id: 'inv-1' }]);
    expect(tx.invoice.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('finds an invoice by id, scoped to the tenant', async () => {
    tx.invoice.findFirst.mockResolvedValue({ id: 'inv-1' });

    const result = await repository.findById('tenant-1', 'inv-1');

    expect(result).toEqual({ id: 'inv-1' });
    expect(tx.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'inv-1', tenantId: 'tenant-1' },
    });
  });

  it('updates an invoice', async () => {
    tx.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' });

    const result = await repository.update('tenant-1', 'inv-1', { status: 'PAID' });

    expect(result).toEqual({ id: 'inv-1', status: 'PAID' });
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'PAID' },
    });
  });
});
