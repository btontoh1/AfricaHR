import { PrismaService } from '@africahr/platform-database';
import { BillingTenantContactRepository } from './billing-tenant-contact.repository';

describe('BillingTenantContactRepository', () => {
  let repository: BillingTenantContactRepository;
  let tx: { user: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock; tenant: { findFirst: jest.Mock } };

  beforeEach(() => {
    tx = { user: { findFirst: jest.fn() } };
    prisma = {
      withTenantContext: jest.fn((_tenantId, fn) => fn(tx)),
      tenant: { findFirst: jest.fn() },
    };
    repository = new BillingTenantContactRepository(prisma as unknown as PrismaService);
  });

  it('returns the earliest-created active TENANT_ADMIN email', async () => {
    tx.user.findFirst.mockResolvedValue({ email: 'admin@acme.com' });

    const result = await repository.findAdminEmail('tenant-1');

    expect(result).toBe('admin@acme.com');
    expect(tx.user.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', role: 'TENANT_ADMIN', deletedAt: null, isActive: true },
      select: { email: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('returns null when the tenant has no active admin', async () => {
    tx.user.findFirst.mockResolvedValue(null);

    await expect(repository.findAdminEmail('tenant-1')).resolves.toBeNull();
  });

  describe('findCurrency', () => {
    it("returns the tenant's operating currency", async () => {
      prisma.tenant.findFirst.mockResolvedValue({ currency: 'GHS' });

      const result = await repository.findCurrency('tenant-1');

      expect(result).toBe('GHS');
      expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { id: 'tenant-1', deletedAt: null },
        select: { currency: true },
      });
    });

    it('returns null when the tenant does not exist', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(repository.findCurrency('tenant-1')).resolves.toBeNull();
    });
  });
});
