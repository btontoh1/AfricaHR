import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './payslip.service';
import { PayRunService } from './pay-run.service';

describe('PayslipController', () => {
  let controller: PayslipController;
  let service: jest.Mocked<PayslipService>;
  let payRuns: jest.Mocked<PayRunService>;

  const payrollManager: RequestUser = {
    sub: 'mgr-1',
    email: 'payroll@acme.com',
    role: SystemRole.PAYROLL_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      findById: jest.fn(),
      findByIdWithPeriod: jest.fn(),
      listByPayRun: jest.fn(),
      listByEmployee: jest.fn(),
      addLineItem: jest.fn(),
      removeLineItem: jest.fn(),
    } as unknown as jest.Mocked<PayslipService>;

    payRuns = {
      retryDisbursement: jest.fn(),
    } as unknown as jest.Mocked<PayRunService>;

    controller = new PayslipController(service, payRuns);
  });

  it('lists by payRunId when provided', () => {
    controller.list('tenant-1', payrollManager, 'run-1', undefined);

    expect(service.listByPayRun).toHaveBeenCalledWith('tenant-1', 'run-1');
    expect(service.listByEmployee).not.toHaveBeenCalled();
  });

  it('lists by employeeId when payRunId is absent', () => {
    controller.list('tenant-1', payrollManager, undefined, 'emp-1');

    expect(service.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
  });

  it('rejects listing with neither filter', () => {
    expect(() => controller.list('tenant-1', payrollManager, undefined, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'payslip-1', payrollManager)).toThrow(
      ForbiddenException,
    );
  });

  it('finds a payslip with its pay period included', () => {
    controller.findById('tenant-1', 'payslip-1', payrollManager);

    expect(service.findByIdWithPeriod).toHaveBeenCalledWith('tenant-1', 'payslip-1');
  });

  it('delegates addLineItem and removeLineItem with tenant, id, and actor', () => {
    const dto = { type: 'EARNING', code: 'OVERTIME', amount: 150 } as never;

    controller.addLineItem('tenant-1', 'payslip-1', dto, payrollManager);
    controller.removeLineItem('tenant-1', 'payslip-1', 'li-1', payrollManager);

    expect(service.addLineItem).toHaveBeenCalledWith('tenant-1', 'payslip-1', dto, 'mgr-1');
    expect(service.removeLineItem).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'li-1', 'mgr-1');
  });

  it('delegates retryDisbursement with tenant, id, and actor', async () => {
    await controller.retryDisbursement('tenant-1', 'payslip-1', payrollManager);

    expect(payRuns.retryDisbursement).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'mgr-1');
  });

  it('rejects retryDisbursement for an actor acting on a different tenant', async () => {
    await expect(controller.retryDisbursement('tenant-2', 'payslip-1', payrollManager)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
