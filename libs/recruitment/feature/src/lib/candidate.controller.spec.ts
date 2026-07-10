import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

describe('CandidateController', () => {
  let controller: CandidateController;
  let service: jest.Mocked<CandidateService>;

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
      update: jest.fn(),
    } as unknown as jest.Mocked<CandidateService>;

    controller = new CandidateController(service);
  });

  it('lists with an email filter within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'ama@example.com');

    expect(service.list).toHaveBeenCalledWith('tenant-1', { email: 'ama@example.com' });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'cand-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates create with tenant, dto, and actor', () => {
    const dto = { firstName: 'Ama', lastName: 'Boateng', email: 'ama@example.com' };

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { firstName: 'New' };

    controller.update('tenant-1', 'cand-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'cand-1', dto, 'hr-1');
  });
});
