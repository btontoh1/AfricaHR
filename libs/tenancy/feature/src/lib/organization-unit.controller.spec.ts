import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { OrganizationUnitController } from './organization-unit.controller';
import { OrganizationUnitService } from './organization-unit.service';

describe('OrganizationUnitController', () => {
  let controller: OrganizationUnitController;
  let units: jest.Mocked<OrganizationUnitService>;

  const tenantAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    units = {
      create: jest.fn(),
      listByOrganization: jest.fn(),
      updateParent: jest.fn(),
    } as unknown as jest.Mocked<OrganizationUnitService>;

    controller = new OrganizationUnitController(units);
  });

  it('delegates updateParent within the route tenant', () => {
    controller.updateParent('tenant-1', 'unit-1', { parentId: 'unit-2' }, tenantAdmin);

    expect(units.updateParent).toHaveBeenCalledWith('tenant-1', 'unit-1', 'unit-2', 'admin-1');
  });

  it('rejects a tenant admin acting on a different tenant', () => {
    expect(() =>
      controller.updateParent('tenant-2', 'unit-1', { parentId: null }, tenantAdmin),
    ).toThrow(ForbiddenException);
  });
});
