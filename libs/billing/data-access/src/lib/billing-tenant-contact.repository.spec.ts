import { PrismaService } from '@africahr/platform-database';
import { BillingTenantContactRepository } from './billing-tenant-contact.repository';

describe('BillingTenantContactRepository', () => {
  let repository: BillingTenantContactRepository;
  let tx: { user: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { user: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
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
});
