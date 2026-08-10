import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AttendanceReportController } from './attendance-report.controller';
import { AttendanceReportService } from './attendance-report.service';

describe('AttendanceReportController', () => {
  let controller: AttendanceReportController;
  let service: jest.Mocked<AttendanceReportService>;

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
    service = { generate: jest.fn() } as unknown as jest.Mocked<AttendanceReportService>;
    controller = new AttendanceReportController(service);
  });

  it('delegates with from/to/organizationId filters within the route tenant', () => {
    controller.generate('tenant-1', hrManager, '2026-01-01', '2026-01-31', 'org-1');

    expect(service.generate).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.generate('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
