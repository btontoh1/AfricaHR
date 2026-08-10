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
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      getStatus: jest.fn(),
      setup: jest.fn(),
      confirm: jest.fn(),
      setupSms: jest.fn(),
      confirmSms: jest.fn(),
      disable: jest.fn(),
      forgetAllDevices: jest.fn(),
    } as unknown as jest.Mocked<MfaService>;

    controller = new MyMfaController(service);
  });

  it('delegates status to the caller\'s own actor', () => {
    controller.status(actor);

    expect(service.getStatus).toHaveBeenCalledWith(actor);
  });

  it('delegates setup to the caller\'s own actor', () => {
    controller.setup(actor);

    expect(service.setup).toHaveBeenCalledWith(actor);
  });

  it('delegates confirm with the submitted code', () => {
    controller.confirm({ code: '123456' }, actor);

    expect(service.confirm).toHaveBeenCalledWith(actor, '123456');
  });

  it('delegates setup-sms with the submitted phone number', async () => {
    await controller.setupSms({ phoneNumber: '+233201234567' }, actor);

    expect(service.setupSms).toHaveBeenCalledWith(actor, '+233201234567');
  });

  it('delegates confirm-sms with the submitted code', () => {
    controller.confirmSms({ code: '123456' }, actor);

    expect(service.confirmSms).toHaveBeenCalledWith(actor, '123456');
  });

  it('delegates disable with the submitted password', async () => {
    await controller.disable({ password: 'secret' }, actor);

    expect(service.disable).toHaveBeenCalledWith(actor, 'secret');
  });

  it('delegates forgetAllDevices to the caller\'s own actor', async () => {
    await controller.forgetAllDevices(actor);

    expect(service.forgetAllDevices).toHaveBeenCalledWith(actor);
  });
});
