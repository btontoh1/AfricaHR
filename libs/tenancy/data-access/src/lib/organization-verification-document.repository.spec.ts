import { PrismaService } from '@africahr/platform-database';
import { OrganizationVerificationDocumentRepository } from './organization-verification-document.repository';

describe('OrganizationVerificationDocumentRepository', () => {
  let repository: OrganizationVerificationDocumentRepository;
  let tx: {
    organizationVerificationDocument: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock; $queryRaw: jest.Mock };

  beforeEach(() => {
    tx = {
      organizationVerificationDocument: {
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
    repository = new OrganizationVerificationDocumentRepository(prisma as unknown as PrismaService);
  });

  it('creates a document within the tenant context', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      documentType: 'CERTIFICATE_OF_INCORPORATION',
      storageKey: 'verification-docs/tenant-1/org-1/uuid-cert.pdf',
      fileName: 'cert.pdf',
      contentType: 'application/pdf',
      createdBy: 'user-1',
    });

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.organizationVerificationDocument.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        documentType: 'CERTIFICATE_OF_INCORPORATION',
        storageKey: 'verification-docs/tenant-1/org-1/uuid-cert.pdf',
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        createdBy: 'user-1',
      },
    });
  });

  it('scopes findById to the tenant and excludes soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'doc-1');

    expect(tx.organizationVerificationDocument.findFirst).toHaveBeenCalledWith({
      where: { id: 'doc-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('lists documents scoped to the tenant and organization', async () => {
    await repository.listByOrganization('tenant-1', 'org-1');

    expect(tx.organizationVerificationDocument.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('soft-deletes a document within the tenant context', async () => {
    await repository.softDelete('tenant-1', 'doc-1');

    expect(tx.organizationVerificationDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('findByIdAcrossTenants looks up a document without a tenant filter via the SECURITY DEFINER function', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: 'doc-1' }]);

    const result = await repository.findByIdAcrossTenants('doc-1');

    expect(prisma.withTenantContext).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({ id: 'doc-1' });
  });

  it('findByIdAcrossTenants returns null when no document matches', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(repository.findByIdAcrossTenants('missing')).resolves.toBeNull();
  });

  it('listByOrganizationAcrossTenants lists documents without a tenant filter via the SECURITY DEFINER function', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: 'doc-1' }]);

    const result = await repository.listByOrganizationAcrossTenants('org-1');

    expect(prisma.withTenantContext).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'doc-1' }]);
  });
});
