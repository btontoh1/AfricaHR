import { PrismaService } from '@africahr/platform-database';
import { OrganizationRepository } from './organization.repository';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let tx: {
    organization: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock; $queryRaw: jest.Mock };

  beforeEach(() => {
    tx = {
      organization: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = {
      withTenantContext: jest.fn((_tenantId, fn) => fn(tx)),
      $queryRaw: jest.fn(),
    };
    repository = new OrganizationRepository(prisma as unknown as PrismaService);
  });

  it('creates an organization within the tenant context', async () => {
    await repository.create('tenant-1', {
      legalName: 'Acme Ghana Ltd',
      countryCode: 'GH',
      registrationNumber: 'BN-12345',
    });

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.organization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        legalName: 'Acme Ghana Ltd',
        registrationNumber: 'BN-12345',
      }),
    });
  });

  it('scopes findById to the tenant and excludes soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'org-1');

    expect(tx.organization.findFirst).toHaveBeenCalledWith({
      where: { id: 'org-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('lists organizations scoped to the tenant', async () => {
    await repository.listByTenant('tenant-1');

    expect(tx.organization.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  });

  describe('verification', () => {
    it('submitForVerification moves the org to PENDING_REVIEW and clears any prior note', async () => {
      await repository.submitForVerification('tenant-1', 'org-1', 'user-1');

      expect(tx.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { verificationStatus: 'PENDING_REVIEW', verificationNote: null, updatedBy: 'user-1' },
      });
    });

    it('verify sets VERIFIED and stamps the reviewer', async () => {
      await repository.verify('tenant-1', 'org-1', 'reviewer-1');

      expect(tx.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: expect.objectContaining({
          verificationStatus: 'VERIFIED',
          verificationNote: null,
          verifiedBy: 'reviewer-1',
          updatedBy: 'reviewer-1',
        }),
      });
    });

    it('reject sets REJECTED with the given note and stamps the reviewer', async () => {
      await repository.reject('tenant-1', 'org-1', 'Registration number does not match the certificate', 'reviewer-1');

      expect(tx.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: expect.objectContaining({
          verificationStatus: 'REJECTED',
          verificationNote: 'Registration number does not match the certificate',
          verifiedBy: 'reviewer-1',
          updatedBy: 'reviewer-1',
        }),
      });
    });

    it('listPendingReview queries across all tenants via the SECURITY DEFINER function, bypassing tenant scoping', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await repository.listPendingReview();

      expect(prisma.withTenantContext).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('findByIdAcrossTenants looks up an org without a tenant filter via the SECURITY DEFINER function', async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: 'org-1' }]);

      const result = await repository.findByIdAcrossTenants('org-1');

      expect(prisma.withTenantContext).not.toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({ id: 'org-1' });
    });

    it('findByIdAcrossTenants returns null when no org matches', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(repository.findByIdAcrossTenants('missing')).resolves.toBeNull();
    });
  });
});
