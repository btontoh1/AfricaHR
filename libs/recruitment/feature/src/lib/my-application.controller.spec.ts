import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyApplicationController } from './my-application.controller';
import { ApplicationService } from './application.service';

describe('MyApplicationController', () => {
  let controller: MyApplicationController;
  let service: jest.Mocked<ApplicationService>;

  const manager: RequestUser = {
    sub: 'mgr-user-1',
    email: 'kwame@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForHiringManager: jest.fn(),
      findByIdForHiringManager: jest.fn(),
      advanceAsHiringManager: jest.fn(),
      getResumeViewUrlForHiringManager: jest.fn(),
      getIdentityDocumentViewUrlForHiringManager: jest.fn(),
    } as unknown as jest.Mocked<ApplicationService>;

    controller = new MyApplicationController(service);
  });

  it('lists applications for the caller as hiring manager via their user id', () => {
    controller.list('tenant-1', manager);

    expect(service.listForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1');
  });

  it('finds an application, delegating the hiring-manager check to the service', () => {
    controller.findById('tenant-1', 'app-1', manager);

    expect(service.findByIdForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'app-1');
  });

  it('advances the stage, delegating the hiring-manager check to the service', () => {
    const dto = { stage: 'SCREENING' } as never;

    controller.advance('tenant-1', 'app-1', dto, manager);

    expect(service.advanceAsHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'app-1', dto);
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', manager)).toThrow(ForbiddenException);
  });

  it('delegates getResumeViewUrl, checking hiring-manager status via the service', async () => {
    service.getResumeViewUrlForHiringManager.mockResolvedValue('https://storage.example/signed-get');

    const result = await controller.getResumeViewUrl('tenant-1', 'app-1', manager);

    expect(service.getResumeViewUrlForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'app-1');
    expect(result).toEqual({ viewUrl: 'https://storage.example/signed-get' });
  });

  it('delegates getIdentityDocumentViewUrl, checking hiring-manager status via the service', async () => {
    service.getIdentityDocumentViewUrlForHiringManager.mockResolvedValue('https://storage.example/signed-get');

    const result = await controller.getIdentityDocumentViewUrl('tenant-1', 'app-1', manager);

    expect(service.getIdentityDocumentViewUrlForHiringManager).toHaveBeenCalledWith(
      'tenant-1',
      'mgr-user-1',
      'app-1',
    );
    expect(result).toEqual({ viewUrl: 'https://storage.example/signed-get' });
  });
});
