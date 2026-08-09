import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';

describe('ApplicationController', () => {
  let controller: ApplicationController;
  let service: jest.Mocked<ApplicationService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      advance: jest.fn(),
      sendOffer: jest.fn(),
      respondToOffer: jest.fn(),
      linkHiredEmployee: jest.fn(),
      getResumeViewUrl: jest.fn(),
      getIdentityDocumentViewUrl: jest.fn(),
    } as unknown as jest.Mocked<ApplicationService>;

    controller = new ApplicationController(service);
  });

  it('lists with candidateId/requisitionId/stage filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'cand-1', 'req-1', 'SCREENING');

    expect(service.list).toHaveBeenCalledWith('tenant-1', {
      candidateId: 'cand-1',
      requisitionId: 'req-1',
      stage: 'SCREENING',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'app-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates create with tenant, dto, and actor', () => {
    const dto = { candidateId: 'cand-1', requisitionId: 'req-1' };

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates stage advancement with tenant, id, dto, and actor', () => {
    const dto = { stage: 'SCREENING' } as never;

    controller.advance('tenant-1', 'app-1', dto, hrManager);

    expect(service.advance).toHaveBeenCalledWith('tenant-1', 'app-1', dto, 'hr-1');
  });

  it('delegates sending an offer with tenant, id, dto, and actor', () => {
    const dto = { offeredSalary: 3500, offeredStartDate: '2026-08-01' };

    controller.sendOffer('tenant-1', 'app-1', dto, hrManager);

    expect(service.sendOffer).toHaveBeenCalledWith('tenant-1', 'app-1', dto, 'hr-1');
  });

  it('delegates responding to an offer with tenant, id, dto, and actor', () => {
    const dto = { accepted: true };

    controller.respondToOffer('tenant-1', 'app-1', dto, hrManager);

    expect(service.respondToOffer).toHaveBeenCalledWith('tenant-1', 'app-1', dto, 'hr-1');
  });

  it('delegates linking the hired employee with tenant, id, dto, and actor', () => {
    const dto = { employeeId: 'emp-9' };

    controller.linkHiredEmployee('tenant-1', 'app-1', dto, hrManager);

    expect(service.linkHiredEmployee).toHaveBeenCalledWith('tenant-1', 'app-1', dto, 'hr-1');
  });

  it('delegates getResumeViewUrl and wraps the result as { viewUrl }', async () => {
    service.getResumeViewUrl.mockResolvedValue('https://storage.example/signed-get');

    const result = await controller.getResumeViewUrl('tenant-1', 'app-1', hrManager);

    expect(service.getResumeViewUrl).toHaveBeenCalledWith('tenant-1', 'app-1');
    expect(result).toEqual({ viewUrl: 'https://storage.example/signed-get' });
  });

  it('delegates getIdentityDocumentViewUrl and wraps the result as { viewUrl }', async () => {
    service.getIdentityDocumentViewUrl.mockResolvedValue('https://storage.example/signed-get');

    const result = await controller.getIdentityDocumentViewUrl('tenant-1', 'app-1', hrManager);

    expect(service.getIdentityDocumentViewUrl).toHaveBeenCalledWith('tenant-1', 'app-1');
    expect(result).toEqual({ viewUrl: 'https://storage.example/signed-get' });
  });
});
