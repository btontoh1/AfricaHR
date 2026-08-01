import { PrismaService } from '@africahr/platform-database';
import { PlatformBillingRepository } from './platform-billing.repository';

describe('PlatformBillingRepository', () => {
  let repository: PlatformBillingRepository;
  let prisma: { $queryRaw: jest.Mock; tenant: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn(), tenant: { findMany: jest.fn() } };
    repository = new PlatformBillingRepository(prisma as unknown as PrismaService);
  });

  it('lists all subscriptions across tenants and parses the decimal price', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 'sub-1', tenantId: 'tenant-1', pricePerEmployee: '10.50', status: 'ACTIVE' },
    ]);

    const result = await repository.listAllSubscriptions();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual([
      { id: 'sub-1', tenantId: 'tenant-1', pricePerEmployee: 10.5, status: 'ACTIVE' },
    ]);
  });

  it('returns active employee counts keyed by tenant', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { tenantId: 'tenant-1', activeCount: '20' },
      { tenantId: 'tenant-2', activeCount: '5' },
    ]);

    const result = await repository.listActiveEmployeeCounts();

    expect(result).toEqual(
      new Map([
        ['tenant-1', 20],
        ['tenant-2', 5],
      ]),
    );
  });

  it('returns paid revenue grouped by currency', async () => {
    prisma.$queryRaw.mockResolvedValue([{ currency: 'GHS', totalPaid: '1500.00' }]);

    const result = await repository.getRevenueByCurrency();

    expect(result).toEqual([{ currency: 'GHS', totalPaid: 1500 }]);
  });

  it('finds an invoice by paystack reference across tenants', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 'inv-1', tenantId: 'tenant-1', amount: '500.00', status: 'PENDING' },
    ]);

    const result = await repository.findInvoiceByPaystackReference('ref-123');

    expect(result).toEqual({ id: 'inv-1', tenantId: 'tenant-1', amount: 500, status: 'PENDING' });
  });

  it('returns null when no invoice matches the reference', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(repository.findInvoiceByPaystackReference('missing')).resolves.toBeNull();
  });

  it('looks up tenant names by id via a plain unscoped query', async () => {
    prisma.tenant.findMany.mockResolvedValue([{ id: 'tenant-1', name: 'Acme Ghana Ltd' }]);

    const result = await repository.listTenantNames(['tenant-1']);

    expect(result).toEqual(new Map([['tenant-1', 'Acme Ghana Ltd']]));
    expect(prisma.tenant.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['tenant-1'] } },
      select: { id: true, name: true },
    });
  });

  it('skips the query entirely for an empty id list', async () => {
    const result = await repository.listTenantNames([]);

    expect(result).toEqual(new Map());
    expect(prisma.tenant.findMany).not.toHaveBeenCalled();
  });
});
