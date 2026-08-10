import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyJobRequisitionController } from './my-job-requisition.controller';
import { JobRequisitionService } from './job-requisition.service';

describe('MyJobRequisitionController', () => {
  let controller: MyJobRequisitionController;
  let service: jest.Mocked<JobRequisitionService>;

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
      updateForHiringManager: jest.fn(),
    } as unknown as jest.Mocked<JobRequisitionService>;

    controller = new MyJobRequisitionController(service);
  });

  it('lists requisitions for the caller as hiring manager via their user id', () => {
    controller.list('tenant-1', manager);

    expect(service.listForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1');
  });

  it('finds a requisition, delegating the hiring-manager check to the service', () => {
    controller.findById('tenant-1', 'req-1', manager);

    expect(service.findByIdForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'req-1');
  });

  it('updates a requisition, delegating the hiring-manager check to the service', () => {
    const dto = { title: 'Senior Engineer' };

    controller.update('tenant-1', 'req-1', dto, manager);

    expect(service.updateForHiringManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'req-1', dto);
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', manager)).toThrow(ForbiddenException);
  });
});
