import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';
import { assertOrganizationScope } from './assert-organization-scope';

describe('assertOrganizationScope', () => {
  function actor(overrides: Partial<RequestUser>): RequestUser {
    return {
      sub: 'user-1',
      email: 'user@acme.com',
      role: SystemRole.ORG_ADMIN,
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      iat: 1,
      exp: 2,
      ...overrides,
    };
  }

  it('allows an org admin to act on their own organization', () => {
    expect(() => assertOrganizationScope(actor({ organizationId: 'org-1' }), 'org-1')).not.toThrow();
  });

  it('rejects an org admin acting on a different organization', () => {
    expect(() => assertOrganizationScope(actor({ organizationId: 'org-1' }), 'org-2')).toThrow(
      ForbiddenException,
    );
  });

  it('allows a tenant-wide role (e.g. TENANT_ADMIN) to act on any organization', () => {
    expect(() =>
      assertOrganizationScope(actor({ role: SystemRole.TENANT_ADMIN, organizationId: null }), 'org-2'),
    ).not.toThrow();
  });

  it('allows PLATFORM_ADMIN to act on any organization', () => {
    expect(() =>
      assertOrganizationScope(
        actor({ role: SystemRole.PLATFORM_ADMIN, tenantId: null, organizationId: null }),
        'org-2',
      ),
    ).not.toThrow();
  });
});
