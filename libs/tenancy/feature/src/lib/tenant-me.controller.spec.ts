import { NotFoundException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PerformanceFramework, Tenant } from '@prisma/client';
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
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const platformAdmin: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
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
    logoStorageKey: null,
    performanceFramework: PerformanceFramework.STANDARD,
    enabledAddOns: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    tenants = {
      findById: jest.fn(),
      getLogoUrl: jest.fn().mockResolvedValue(null),
      requestLogoUpload: jest.fn(),
      removeLogo: jest.fn(),
    } as unknown as jest.Mocked<TenantService>;
    controller = new TenantMeController(tenants);
  });

  it("returns the caller's own tenant name, slug, and logo", async () => {
    tenants.findById.mockResolvedValue(tenant);
    tenants.getLogoUrl.mockResolvedValue('https://storage.example/view?sig=xyz');

    await expect(controller.findMine(tenantUser)).resolves.toEqual({
      name: 'Acme Ghana Ltd',
      slug: 'acme-ghana-ltd',
      logoUrl: 'https://storage.example/view?sig=xyz',
      performanceFramework: PerformanceFramework.STANDARD,
      enabledAddOns: [],
    });
    expect(tenants.findById).toHaveBeenCalledWith('tenant-1');
  });

  it('rejects a platform admin with no tenant', async () => {
    await expect(controller.findMine(platformAdmin)).rejects.toThrow(NotFoundException);
    expect(tenants.findById).not.toHaveBeenCalled();
  });

  describe('requestLogoUpload', () => {
    it("delegates to the service with the caller's tenant", async () => {
      tenants.requestLogoUpload.mockResolvedValue({ uploadUrl: 'https://storage.example/upload?sig=abc' });

      await expect(
        controller.requestLogoUpload(tenantUser, { fileName: 'logo.png', contentType: 'image/png' }),
      ).resolves.toEqual({ uploadUrl: 'https://storage.example/upload?sig=abc' });
      expect(tenants.requestLogoUpload).toHaveBeenCalledWith(
        'tenant-1',
        { fileName: 'logo.png', contentType: 'image/png' },
        'user-1',
      );
    });

    it('rejects a platform admin with no tenant', async () => {
      await expect(
        controller.requestLogoUpload(platformAdmin, { fileName: 'logo.png', contentType: 'image/png' }),
      ).rejects.toThrow(NotFoundException);
      expect(tenants.requestLogoUpload).not.toHaveBeenCalled();
    });
  });

  describe('removeLogo', () => {
    it("delegates to the service with the caller's tenant", async () => {
      await controller.removeLogo(tenantUser);
      expect(tenants.removeLogo).toHaveBeenCalledWith('tenant-1', 'user-1');
    });

    it('rejects a platform admin with no tenant', async () => {
      await expect(controller.removeLogo(platformAdmin)).rejects.toThrow(NotFoundException);
      expect(tenants.removeLogo).not.toHaveBeenCalled();
    });
  });
});
