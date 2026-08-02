import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyPasswordController } from './my-password.controller';
import { UserService } from './user.service';

describe('MyPasswordController', () => {
  let controller: MyPasswordController;
  let service: jest.Mocked<UserService>;

  const actor: RequestUser = {
    sub: 'user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = { changePassword: jest.fn() } as unknown as jest.Mocked<UserService>;
    controller = new MyPasswordController(service);
  });

  it('delegates to UserService.changePassword with the caller\'s own actor', async () => {
    const dto = { currentPassword: 'old', newPassword: 'new' };

    await controller.change(dto, actor);

    expect(service.changePassword).toHaveBeenCalledWith(actor, dto);
  });
});
