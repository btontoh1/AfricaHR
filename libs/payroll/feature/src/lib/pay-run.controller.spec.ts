import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PayRunController } from './pay-run.controller';
import { PayRunService } from './pay-run.service';

describe('PayRunController', () => {
  let controller: PayRunController;
  let service: jest.Mocked<PayRunService>;

  const payrollManager: RequestUser = {
    sub: 'mgr-1',
    email: 'payroll@acme.com',
    role: SystemRole.PAYROLL_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      process: jest.fn(),
      approve: jest.fn(),
      markPaid: jest.fn(),
      close: jest.fn(),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<PayRunService>;

    controller = new PayRunController(service);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = {
      organizationId: 'org-1',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      payDate: '2026-02-01',
    } as never;

    controller.create('tenant-1', dto, payrollManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'mgr-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', payrollManager)).toThrow(ForbiddenException);
  });

  it('delegates process/approve/pay/close/cancel with tenant, id, and actor', () => {
    controller.process('tenant-1', 'run-1', payrollManager);
    controller.approve('tenant-1', 'run-1', payrollManager);
    controller.markPaid('tenant-1', 'run-1', payrollManager);
    controller.close('tenant-1', 'run-1', payrollManager);
    controller.cancel('tenant-1', 'run-1', payrollManager);

    expect(service.process).toHaveBeenCalledWith('tenant-1', 'run-1', 'mgr-1');
    expect(service.approve).toHaveBeenCalledWith('tenant-1', 'run-1', 'mgr-1');
    expect(service.markPaid).toHaveBeenCalledWith('tenant-1', 'run-1', 'mgr-1');
    expect(service.close).toHaveBeenCalledWith('tenant-1', 'run-1', 'mgr-1');
    expect(service.cancel).toHaveBeenCalledWith('tenant-1', 'run-1', 'mgr-1');
  });
});
