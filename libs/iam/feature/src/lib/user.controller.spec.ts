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
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      updateRole: jest.fn(),
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

  it('delegates updateRole with the id, role, and actor', () => {
    controller.updateRole('user-2', { role: SystemRole.HR_MANAGER }, actor);

    expect(userService.updateRole).toHaveBeenCalledWith(actor, 'user-2', SystemRole.HR_MANAGER);
  });

  it('delegates setActive with the id, flag, and actor', () => {
    controller.setActive('user-2', { isActive: false }, actor);

    expect(userService.setActive).toHaveBeenCalledWith(actor, 'user-2', false);
  });
});
