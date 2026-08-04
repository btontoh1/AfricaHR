import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyLeaveBalanceController } from './my-leave-balance.controller';
import { LeaveRequestService } from './leave-request.service';

describe('MyLeaveBalanceController', () => {
  let controller: MyLeaveBalanceController;
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
      listBalancesForSelf: jest.fn(),
    } as unknown as jest.Mocked<LeaveRequestService>;

    controller = new MyLeaveBalanceController(service);
  });

  it('lists the caller’s own balances via their user id', () => {
    controller.list('tenant-1', employee);

    expect(service.listBalancesForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
