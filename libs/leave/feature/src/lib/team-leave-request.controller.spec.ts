import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { TeamLeaveRequestController } from './team-leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

describe('TeamLeaveRequestController', () => {
  let controller: TeamLeaveRequestController;
  let service: jest.Mocked<LeaveRequestService>;

  const manager: RequestUser = {
    sub: 'mgr-user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForDirectReports: jest.fn(),
      approveAsManager: jest.fn(),
      rejectAsManager: jest.fn(),
    } as unknown as jest.Mocked<LeaveRequestService>;

    controller = new TeamLeaveRequestController(service);
  });

  it('lists requests for the caller’s direct reports via their user id', () => {
    controller.list('tenant-1', manager);

    expect(service.listForDirectReports).toHaveBeenCalledWith('tenant-1', 'mgr-user-1');
  });

  it('approves a request, delegating the direct-manager check to the service', () => {
    controller.approve('tenant-1', 'req-1', manager);

    expect(service.approveAsManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'req-1');
  });

  it('rejects a request, delegating the direct-manager check to the service', () => {
    controller.reject('tenant-1', 'req-1', { rejectionReason: 'No coverage' }, manager);

    expect(service.rejectAsManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'req-1', 'No coverage');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', manager)).toThrow(ForbiddenException);
  });
});
