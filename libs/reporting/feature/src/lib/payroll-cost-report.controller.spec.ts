import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PayrollCostReportController } from './payroll-cost-report.controller';
import { PayrollCostReportService } from './payroll-cost-report.service';

describe('PayrollCostReportController', () => {
  let controller: PayrollCostReportController;
  let service: jest.Mocked<PayrollCostReportService>;

  const payrollManager: RequestUser = {
    sub: 'payroll-1',
    email: 'payroll@acme.com',
    role: SystemRole.PAYROLL_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = { generate: jest.fn() } as unknown as jest.Mocked<PayrollCostReportService>;
    controller = new PayrollCostReportController(service);
  });

  it('delegates with from/to/organizationId filters within the route tenant', () => {
    controller.generate('tenant-1', payrollManager, '2026-01-01', '2026-01-31', 'org-1');

    expect(service.generate).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.generate('tenant-2', payrollManager)).toThrow(ForbiddenException);
  });
});
