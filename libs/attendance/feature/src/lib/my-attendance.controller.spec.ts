import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyAttendanceController } from './my-attendance.controller';
import { AttendanceRecordService } from './attendance-record.service';

describe('MyAttendanceController', () => {
  let controller: MyAttendanceController;
  let service: jest.Mocked<AttendanceRecordService>;

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
      clockInForSelf: jest.fn(),
      clockOutForSelf: jest.fn(),
    } as unknown as jest.Mocked<AttendanceRecordService>;

    controller = new MyAttendanceController(service);
  });

  it('lists the caller’s own records via their user id', () => {
    controller.list('tenant-1', employee, '2026-02-01', '2026-02-28');

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', {
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('clocks in the caller via their user id', () => {
    controller.clockIn('tenant-1', employee);

    expect(service.clockInForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('clocks out the caller via their user id', () => {
    controller.clockOut('tenant-1', employee);

    expect(service.clockOutForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('rejects an actor acting on a different tenant even for self-service routes', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
