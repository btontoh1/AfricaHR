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
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    units = {
      create: jest.fn(),
      listByOrganization: jest.fn(),
      updateParent: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

  it('delegates update within the route tenant', () => {
    controller.update('tenant-1', 'unit-1', { name: 'Payroll' }, tenantAdmin);

    expect(units.update).toHaveBeenCalledWith('tenant-1', 'unit-1', { name: 'Payroll' }, 'admin-1');
  });

  it('rejects update for a tenant admin acting on a different tenant', () => {
    expect(() => controller.update('tenant-2', 'unit-1', { name: 'Payroll' }, tenantAdmin)).toThrow(
      ForbiddenException,
    );
  });

  it('delegates remove within the route tenant', () => {
    controller.remove('tenant-1', 'unit-1', tenantAdmin);

    expect(units.remove).toHaveBeenCalledWith('tenant-1', 'unit-1', 'admin-1');
  });

  it('rejects remove for a tenant admin acting on a different tenant', () => {
    expect(() => controller.remove('tenant-2', 'unit-1', tenantAdmin)).toThrow(ForbiddenException);
  });
});
