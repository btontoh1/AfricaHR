import { NotFoundException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { Tenant } from '@prisma/client';
import { TenantStatus } from '@africahr/tenancy-domain';
import { TenantMeController } from './tenant-me.controller';
import { TenantService } from './tenant.service';

describe('TenantMeController', () => {
  let controller: TenantMeController;
  let tenants: jest.Mocked<TenantService>;

  const tenantUser: RequestUser = {
    sub: 'user-1',
    email: 'hr@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  const platformAdmin: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    iat: 1,
    exp: 2,
  };

  const tenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    status: TenantStatus.ACTIVE,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    tenants = { findById: jest.fn() } as unknown as jest.Mocked<TenantService>;
    controller = new TenantMeController(tenants);
  });

  it("returns the caller's own tenant name and slug", async () => {
    tenants.findById.mockResolvedValue(tenant);

    await expect(controller.findMine(tenantUser)).resolves.toEqual({
      name: 'Acme Ghana Ltd',
      slug: 'acme-ghana-ltd',
    });
    expect(tenants.findById).toHaveBeenCalledWith('tenant-1');
  });

  it('rejects a platform admin with no tenant', async () => {
    await expect(controller.findMine(platformAdmin)).rejects.toThrow(NotFoundException);
    expect(tenants.findById).not.toHaveBeenCalled();
  });
});
