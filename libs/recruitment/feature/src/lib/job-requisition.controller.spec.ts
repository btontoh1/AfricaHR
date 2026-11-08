import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { JobRequisitionController } from './job-requisition.controller';
import { JobRequisitionService } from './job-requisition.service';

describe('JobRequisitionController', () => {
  let controller: JobRequisitionController;
  let service: jest.Mocked<JobRequisitionService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<JobRequisitionService>;

    controller = new JobRequisitionController(service);
  });

  it('lists with organizationId/hiringManagerId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'org-1', 'mgr-1', 'OPEN');

    expect(service.list).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      hiringManagerId: 'mgr-1',
      status: 'OPEN',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'req-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates create with tenant, dto, and actor', () => {
    const dto = { organizationId: 'org-1', title: 'Engineer', employmentType: 'FULL_TIME' } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { title: 'Senior Engineer' };

    controller.update('tenant-1', 'req-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'req-1', dto, 'hr-1');
  });
});
