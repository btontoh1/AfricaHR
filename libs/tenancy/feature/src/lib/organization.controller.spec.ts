import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let organizations: jest.Mocked<OrganizationService>;

  const tenantAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    organizations = {
      create: jest.fn(),
      listByTenant: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<OrganizationService>;

    controller = new OrganizationController(organizations);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = { legalName: 'Acme', countryCode: 'GH', registrationNumber: 'BN-1' };

    controller.create('tenant-1', dto, tenantAdmin);

    expect(organizations.create).toHaveBeenCalledWith('tenant-1', dto, 'admin-1');
  });

  it('rejects a tenant admin acting on a different tenant', () => {
    const dto = { legalName: 'Acme', countryCode: 'GH', registrationNumber: 'BN-1' };

    expect(() => controller.create('tenant-2', dto, tenantAdmin)).toThrow(ForbiddenException);
    expect(organizations.create).not.toHaveBeenCalled();
  });
});
