import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';
import { assertOrganizationUnitScope } from './assert-organization-unit-scope';

describe('assertOrganizationUnitScope', () => {
  function actor(overrides: Partial<RequestUser>): RequestUser {
    return {
      sub: 'user-1',
      email: 'user@acme.com',
      role: SystemRole.UNIT_ADMIN,
      tenantId: 'tenant-1',
      organizationId: null,
      organizationUnitId: 'unit-1',
      iat: 1,
      exp: 2,
      ...overrides,
    };
  }

  it('allows a unit admin to act on their own organization unit', () => {
    expect(() => assertOrganizationUnitScope(actor({ organizationUnitId: 'unit-1' }), 'unit-1')).not.toThrow();
  });

  it('rejects a unit admin acting on a different organization unit', () => {
    expect(() => assertOrganizationUnitScope(actor({ organizationUnitId: 'unit-1' }), 'unit-2')).toThrow(
      ForbiddenException,
    );
  });

  it('allows a tenant-wide role (e.g. TENANT_ADMIN) to act on any organization unit', () => {
    expect(() =>
      assertOrganizationUnitScope(
        actor({ role: SystemRole.TENANT_ADMIN, organizationUnitId: null }),
        'unit-2',
      ),
    ).not.toThrow();
  });

  it('allows ORG_ADMIN to act on any organization unit', () => {
    expect(() =>
      assertOrganizationUnitScope(
        actor({ role: SystemRole.ORG_ADMIN, organizationId: 'org-1', organizationUnitId: null }),
        'unit-2',
      ),
    ).not.toThrow();
  });

  it('allows PLATFORM_ADMIN to act on any organization unit', () => {
    expect(() =>
      assertOrganizationUnitScope(
        actor({ role: SystemRole.PLATFORM_ADMIN, tenantId: null, organizationUnitId: null }),
        'unit-2',
      ),
    ).not.toThrow();
  });
});
