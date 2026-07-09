import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';
import { assertTenantScope } from './assert-tenant-scope';

describe('assertTenantScope', () => {
  function actor(overrides: Partial<RequestUser>): RequestUser {
    return {
      sub: 'user-1',
      email: 'user@acme.com',
      role: SystemRole.TENANT_ADMIN,
      tenantId: 'tenant-1',
      iat: 1,
      exp: 2,
      ...overrides,
    };
  }

  it('allows a platform admin to act on any tenant', () => {
    expect(() =>
      assertTenantScope(actor({ role: SystemRole.PLATFORM_ADMIN, tenantId: null }), 'tenant-9'),
    ).not.toThrow();
  });

  it('allows a tenant admin to act on their own tenant', () => {
    expect(() => assertTenantScope(actor({ tenantId: 'tenant-1' }), 'tenant-1')).not.toThrow();
  });

  it('rejects a tenant admin acting on a different tenant', () => {
    expect(() => assertTenantScope(actor({ tenantId: 'tenant-1' }), 'tenant-2')).toThrow(
      ForbiddenException,
    );
  });
});
