import { TenantStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { TenantRepository } from './tenant.repository';

describe('TenantRepository', () => {
  let repository: TenantRepository;
  let prisma: {
    tenant: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      tenant: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new TenantRepository(prisma as unknown as PrismaService);
  });

  it('creates a tenant with createdBy mirrored to updatedBy', async () => {
    await repository.create({
      name: 'Acme Ghana',
      slug: 'acme-ghana',
      country: 'GH',
      currency: 'GHS',
      timezone: 'Africa/Accra',
      createdBy: 'ops-user-1',
    });

    expect(prisma.tenant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Acme Ghana',
        slug: 'acme-ghana',
        createdBy: 'ops-user-1',
        updatedBy: 'ops-user-1',
      }),
    });
  });

  it('excludes soft-deleted tenants when finding by id', async () => {
    await repository.findById('tenant-1');

    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
      where: { id: 'tenant-1', deletedAt: null },
    });
  });

  it('excludes soft-deleted tenants when finding by slug', async () => {
    await repository.findBySlug('acme-ghana');

    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
      where: { slug: 'acme-ghana', deletedAt: null },
    });
  });

  it('updates status', async () => {
    await repository.updateStatus('tenant-1', TenantStatus.ACTIVE, 'ops-user-1');

    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { status: TenantStatus.ACTIVE, updatedBy: 'ops-user-1' },
    });
  });

  it('soft-deletes by setting deletedAt', async () => {
    await repository.softDelete('tenant-1', 'ops-user-1');

    const call = prisma.tenant.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'tenant-1' });
    expect(call.data.deletedAt).toBeInstanceOf(Date);
    expect(call.data.updatedBy).toBe('ops-user-1');
  });

  it('updates the logo storage key', async () => {
    await repository.updateLogo('tenant-1', 'tenant-logos/tenant-1/uuid-logo.png', 'user-1');

    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { logoStorageKey: 'tenant-logos/tenant-1/uuid-logo.png', updatedBy: 'user-1' },
    });
  });

  it('clears the logo storage key when removing a logo', async () => {
    await repository.updateLogo('tenant-1', null, 'user-1');

    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { logoStorageKey: null, updatedBy: 'user-1' },
    });
  });
});
