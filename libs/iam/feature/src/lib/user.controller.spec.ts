import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const actor: RequestUser = {
    sub: 'actor-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      updateRole: jest.fn(),
      updateProfile: jest.fn(),
      adminResetPassword: jest.fn(),
      setActive: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    controller = new UserController(userService);
  });

  it('delegates create to UserService with the current actor', () => {
    const dto = {
      email: 'x@acme.com',
      password: 'CorrectHorse9',
      firstName: 'A',
      lastName: 'B',
      role: SystemRole.EMPLOYEE,
    };

    controller.create(dto, actor);

    expect(userService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates updateRole with the id, role, actor, and organizationId', () => {
    controller.updateRole('user-2', { role: SystemRole.HR_MANAGER }, actor);

    expect(userService.updateRole).toHaveBeenCalledWith(actor, 'user-2', SystemRole.HR_MANAGER, undefined);
  });

  it('passes organizationId through to updateRole when set', () => {
    controller.updateRole('user-2', { role: SystemRole.ORG_ADMIN, organizationId: 'org-1' }, actor);

    expect(userService.updateRole).toHaveBeenCalledWith(actor, 'user-2', SystemRole.ORG_ADMIN, 'org-1');
  });

  it('delegates setActive with the id, flag, and actor', () => {
    controller.setActive('user-2', { isActive: false }, actor);

    expect(userService.setActive).toHaveBeenCalledWith(actor, 'user-2', false);
  });

  it('delegates updateProfile with the id, dto, and actor', () => {
    const dto = { firstName: 'Kwame' };

    controller.updateProfile('user-2', dto, actor);

    expect(userService.updateProfile).toHaveBeenCalledWith(actor, 'user-2', dto);
  });

  it('delegates resetPassword with the id, new password, and actor', () => {
    controller.resetPassword('user-2', { newPassword: 'NewSecurePass9' }, actor);

    expect(userService.adminResetPassword).toHaveBeenCalledWith(actor, 'user-2', 'NewSecurePass9');
  });
});
