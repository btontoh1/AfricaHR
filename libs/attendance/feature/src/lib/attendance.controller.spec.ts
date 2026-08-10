import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AttendanceController } from './attendance.controller';
import { AttendanceRecordService } from './attendance-record.service';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceRecordService>;

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
    } as unknown as jest.Mocked<AttendanceRecordService>;

    controller = new AttendanceController(service);
  });

  it('lists with employeeId/date-range filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'emp-1', '2026-02-01', '2026-02-28');

    expect(service.list).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'emp-1',
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'rec-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates manual create with tenant, dto, and actor', () => {
    const dto = { employeeId: 'emp-1', date: '2026-02-02' } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates correction update with tenant, id, dto, and actor', () => {
    const dto = { notes: 'corrected' } as never;

    controller.update('tenant-1', 'rec-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'rec-1', dto, 'hr-1');
  });
});
