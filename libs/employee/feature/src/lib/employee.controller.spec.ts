import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeBulkImportService } from './employee-bulk-import.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: jest.Mocked<EmployeeService>;
  let bulkImport: jest.Mocked<EmployeeBulkImportService>;

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
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<EmployeeService>;

    bulkImport = { import: jest.fn() } as unknown as jest.Mocked<EmployeeBulkImportService>;

    controller = new EmployeeController(service, bulkImport);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = {
      organizationId: 'org-1',
      firstName: 'Ama',
      lastName: 'Owusu',
      jobTitle: 'Engineer',
      employmentType: 'FULL_TIME',
      hireDate: '2026-01-01',
      countryCode: 'GH',
    } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, hrManager);
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates list with tenant, params, and actor', () => {
    controller.list('tenant-1', hrManager, 'org-1', 'unit-1');

    expect(service.list).toHaveBeenCalledWith(
      'tenant-1',
      { organizationId: 'org-1', organizationUnitId: 'unit-1' },
      hrManager,
    );
  });

  it('delegates findById with tenant, id, and actor', () => {
    controller.findById('tenant-1', 'emp-1', hrManager);

    expect(service.findById).toHaveBeenCalledWith('tenant-1', 'emp-1', hrManager);
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { jobTitle: 'Senior Engineer' } as never;

    controller.update('tenant-1', 'emp-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'emp-1', dto, hrManager);
  });

  it('delegates getHistory with tenant, id, and actor', () => {
    controller.getHistory('tenant-1', 'emp-1', hrManager);

    expect(service.getHistory).toHaveBeenCalledWith('tenant-1', 'emp-1', hrManager);
  });

  it('delegates updateStatus with tenant, id, status, terminationDate, and actor', () => {
    controller.updateStatus(
      'tenant-1',
      'emp-1',
      { status: 'ON_LEAVE' } as never,
      hrManager,
    );

    expect(service.updateStatus).toHaveBeenCalledWith('tenant-1', 'emp-1', 'ON_LEAVE', undefined, hrManager);
  });

  it('delegates softDelete with tenant, id, and actor', () => {
    controller.softDelete('tenant-1', 'emp-1', hrManager);

    expect(service.softDelete).toHaveBeenCalledWith('tenant-1', 'emp-1', hrManager);
  });

  it('rejects softDelete for an actor acting on a different tenant', () => {
    expect(() => controller.softDelete('tenant-2', 'emp-1', hrManager)).toThrow(ForbiddenException);
    expect(service.softDelete).not.toHaveBeenCalled();
  });
});
