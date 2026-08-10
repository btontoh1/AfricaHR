import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

describe('LeaveRequestController', () => {
  let controller: LeaveRequestController;
  let service: jest.Mocked<LeaveRequestService>;

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
      approve: jest.fn(),
      reject: jest.fn(),
      adjustBalance: jest.fn(),
    } as unknown as jest.Mocked<LeaveRequestService>;

    controller = new LeaveRequestController(service);
  });

  it('lists with employeeId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'emp-1', 'PENDING');

    expect(service.list).toHaveBeenCalledWith('tenant-1', { employeeId: 'emp-1', status: 'PENDING' });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'req-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates approve with tenant, id, and actor', () => {
    controller.approve('tenant-1', 'req-1', hrManager);

    expect(service.approve).toHaveBeenCalledWith('tenant-1', 'req-1', 'hr-1');
  });

  it('delegates reject with tenant, id, rejectionReason, and actor', () => {
    const dto = { rejectionReason: 'Insufficient coverage' } as never;

    controller.reject('tenant-1', 'req-1', dto, hrManager);

    expect(service.reject).toHaveBeenCalledWith('tenant-1', 'req-1', 'Insufficient coverage', 'hr-1');
  });

  it('delegates adjustBalance with tenant, dto, and actor', () => {
    const dto = { employeeId: 'emp-1', leaveTypeId: 'lt-1', year: 2026, entitledDays: 25 } as never;

    controller.adjustBalance('tenant-1', dto, hrManager);

    expect(service.adjustBalance).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });
});
