import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: jest.Mocked<EmployeeService>;

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
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<EmployeeService>;

    controller = new EmployeeController(service);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = {
      organizationId: 'org-1',
      firstName: 'Ama',
      lastName: 'Owusu',
      jobTitle: 'Engineer',
      employmentType: 'FULL_TIME',
      hireDate: '2026-01-01',
      countryCode: 'GH',
    } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates updateStatus with tenant, id, status, terminationDate, and actor', () => {
    controller.updateStatus(
      'tenant-1',
      'emp-1',
      { status: 'ON_LEAVE' } as never,
      hrManager,
    );

    expect(service.updateStatus).toHaveBeenCalledWith('tenant-1', 'emp-1', 'ON_LEAVE', undefined, 'hr-1');
  });
});
