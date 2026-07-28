import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyMfaController } from './my-mfa.controller';
import { MfaService } from './mfa.service';

describe('MyMfaController', () => {
  let controller: MyMfaController;
  let service: jest.Mocked<MfaService>;

  const actor: RequestUser = {
    sub: 'user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      setup: jest.fn(),
      confirm: jest.fn(),
      disable: jest.fn(),
    } as unknown as jest.Mocked<MfaService>;

    controller = new MyMfaController(service);
  });

  it('delegates setup to the caller\'s own actor', () => {
    controller.setup(actor);

    expect(service.setup).toHaveBeenCalledWith(actor);
  });

  it('delegates confirm with the submitted code', () => {
    controller.confirm({ code: '123456' }, actor);

    expect(service.confirm).toHaveBeenCalledWith(actor, '123456');
  });

  it('delegates disable with the submitted password', async () => {
    await controller.disable({ password: 'secret' }, actor);

    expect(service.disable).toHaveBeenCalledWith(actor, 'secret');
  });
});
