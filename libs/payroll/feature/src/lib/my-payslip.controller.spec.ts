import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyPayslipController } from './my-payslip.controller';
import { PayslipService } from './payslip.service';

describe('MyPayslipController', () => {
  let controller: MyPayslipController;
  let service: jest.Mocked<PayslipService>;

  const employee: RequestUser = {
    sub: 'emp-user-1',
    email: 'frimpong@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForSelf: jest.fn(),
      findByIdForSelf: jest.fn(),
    } as unknown as jest.Mocked<PayslipService>;

    controller = new MyPayslipController(service);
  });

  it('lists the caller’s own payslips via their user id, not an employeeId param', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('finds a single payslip for the caller via their user id', () => {
    controller.findById('tenant-1', 'payslip-1', employee);

    expect(service.findByIdForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'payslip-1');
  });

  it('rejects an actor acting on a different tenant even for self-service routes', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
