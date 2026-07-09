import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyLeaveRequestController } from './my-leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

describe('MyLeaveRequestController', () => {
  let controller: MyLeaveRequestController;
  let service: jest.Mocked<LeaveRequestService>;

  const employee: RequestUser = {
    sub: 'emp-user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForSelf: jest.fn(),
      createForSelf: jest.fn(),
      cancelForSelf: jest.fn(),
    } as unknown as jest.Mocked<LeaveRequestService>;

    controller = new MyLeaveRequestController(service);
  });

  it('lists the caller’s own requests via their user id, not an employeeId param', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('creates a request for the caller via their user id', () => {
    const dto = { leaveTypeId: 'lt-1', startDate: '2026-02-02', endDate: '2026-02-06' } as never;

    controller.create('tenant-1', dto, employee);

    expect(service.createForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', dto);
  });

  it('cancels a request for the caller via their user id', () => {
    controller.cancel('tenant-1', 'req-1', employee);

    expect(service.cancelForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'req-1');
  });

  it('rejects an actor acting on a different tenant even for self-service routes', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
