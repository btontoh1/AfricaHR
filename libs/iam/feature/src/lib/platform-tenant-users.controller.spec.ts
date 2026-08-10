import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PlatformTenantUsersController } from './platform-tenant-users.controller';
import { UserService } from './user.service';

describe('PlatformTenantUsersController', () => {
  let controller: PlatformTenantUsersController;
  let userService: jest.Mocked<UserService>;

  const actor: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    userService = {
      listForTenant: jest.fn(),
      updateRoleForTenant: jest.fn(),
      updateProfileForTenant: jest.fn(),
      adminResetPasswordForTenant: jest.fn(),
      setActiveForTenant: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    controller = new PlatformTenantUsersController(userService);
  });

  it('delegates list to UserService.listForTenant with the tenant id', () => {
    controller.list('tenant-9');

    expect(userService.listForTenant).toHaveBeenCalledWith('tenant-9');
  });

  it('delegates updateRole with the tenant id, user id, role, and actor id', () => {
    controller.updateRole('tenant-9', 'user-2', { role: SystemRole.HR_MANAGER }, actor);

    expect(userService.updateRoleForTenant).toHaveBeenCalledWith(
      'tenant-9',
      'user-2',
      SystemRole.HR_MANAGER,
      'ops-1',
      undefined,
    );
  });

  it('delegates setActive with the tenant id, user id, flag, and actor id', () => {
    controller.setActive('tenant-9', 'user-2', { isActive: false }, actor);

    expect(userService.setActiveForTenant).toHaveBeenCalledWith('tenant-9', 'user-2', false, 'ops-1');
  });

  it('delegates updateProfile with the tenant id, user id, dto, and actor id', () => {
    const dto = { firstName: 'Kwame' };

    controller.updateProfile('tenant-9', 'user-2', dto, actor);

    expect(userService.updateProfileForTenant).toHaveBeenCalledWith('tenant-9', 'user-2', dto, 'ops-1');
  });

  it('delegates resetPassword with the tenant id, user id, new password, and actor id', () => {
    controller.resetPassword('tenant-9', 'user-2', { newPassword: 'NewSecurePass9' }, actor);

    expect(userService.adminResetPasswordForTenant).toHaveBeenCalledWith(
      'tenant-9',
      'user-2',
      'NewSecurePass9',
      'ops-1',
    );
  });
});
