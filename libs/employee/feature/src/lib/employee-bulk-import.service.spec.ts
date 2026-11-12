import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EmploymentType } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { EmployeeRepository } from '@africahr/employee-data-access';
import { EmployeeBulkImportService } from './employee-bulk-import.service';
import { EmployeeService } from './employee.service';

describe('EmployeeBulkImportService', () => {
  let service: EmployeeBulkImportService;
  let employees: jest.Mocked<EmployeeService>;
  let employeeRepository: jest.Mocked<EmployeeRepository>;

  const tenantAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const orgAdminScopedElsewhere: RequestUser = {
    sub: 'org-admin-1',
    email: 'orgadmin@acme.com',
    role: SystemRole.ORG_ADMIN,
    tenantId: 'tenant-1',
    organizationId: 'org-2',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    employees = { create: jest.fn() } as unknown as jest.Mocked<EmployeeService>;
    employeeRepository = { setClockInPinHash: jest.fn() } as unknown as jest.Mocked<EmployeeRepository>;
    service = new EmployeeBulkImportService(employees, employeeRepository);
  });

  it('creates every valid row and reports nothing failed', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
      'Kwame,Mensah,Designer,FULL_TIME,2026-01-02,GH',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result).toEqual({ created: 2, errors: [] });
    expect(employees.create).toHaveBeenCalledTimes(2);
    expect(employees.create).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      expect.objectContaining({
        organizationId: 'org-1',
        firstName: 'Ama',
        lastName: 'Owusu',
        employmentType: EmploymentType.FULL_TIME,
      }),
      tenantAdmin,
    );
  });

  it('reports a validation error for an invalid row without aborting the batch', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
      ',Mensah,Designer,FULL_TIME,2026-01-02,GH',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].message).toContain('firstName is required');
    expect(employees.create).toHaveBeenCalledTimes(1);
  });

  it('treats a blank optional cell as omitted, not invalid', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode,baseSalary',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH,',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result).toEqual({ created: 1, errors: [] });
    expect(employees.create).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ baseSalary: undefined }),
      tenantAdmin,
    );
  });

  it('captures a create-time failure (e.g. duplicate) as a row error, not a thrown exception', async () => {
    employees.create.mockRejectedValue(new ConflictException('employee number already in use'));
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.created).toBe(0);
    expect(result.errors).toEqual([{ row: 2, message: 'employee number already in use' }]);
  });

  it('reports one error for a missing required column instead of one per row', async () => {
    const csv = ['lastName', 'Owusu'].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('firstName');
    expect(employees.create).not.toHaveBeenCalled();
  });

  it('reports a per-row validation error for jobTitle/employmentType/hireDate/countryCode when no defaults are given', async () => {
    const csv = ['firstName,lastName', 'Ama,Owusu'].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('jobTitle');
    expect(employees.create).not.toHaveBeenCalled();
  });

  it('fills in jobTitle/employmentType/hireDate/countryCode from defaults when a names-only CSV omits those columns', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = ['firstName,lastName', 'Ama,Owusu', 'Kwame,Mensah'].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin, {
      jobTitle: 'Staff',
      employmentType: EmploymentType.FULL_TIME,
      hireDate: '2026-01-01',
      countryCode: 'GH',
    });

    expect(result).toEqual({ created: 2, errors: [] });
    expect(employees.create).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      expect.objectContaining({
        firstName: 'Ama',
        lastName: 'Owusu',
        jobTitle: 'Staff',
        employmentType: EmploymentType.FULL_TIME,
        hireDate: '2026-01-01',
        countryCode: 'GH',
      }),
      tenantAdmin,
    );
  });

  it("prefers a row's own value over the batch default when both are present", async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = [
      'firstName,lastName,jobTitle',
      'Ama,Owusu,Engineer',
    ].join('\n');

    await service.import('tenant-1', 'org-1', csv, tenantAdmin, {
      jobTitle: 'Staff',
      employmentType: EmploymentType.FULL_TIME,
      hireDate: '2026-01-01',
      countryCode: 'GH',
    });

    expect(employees.create).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ jobTitle: 'Engineer' }),
      tenantAdmin,
    );
  });

  it('fills in compensationType/hourlyRate from defaults for a names-only hourly worksite import', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1' } as never);
    const csv = ['firstName,lastName', 'Ama,Owusu'].join('\n');

    await service.import('tenant-1', 'org-1', csv, tenantAdmin, {
      jobTitle: 'Factory Worker',
      employmentType: EmploymentType.FULL_TIME,
      hireDate: '2026-01-01',
      countryCode: 'GH',
      compensationType: 'HOURLY',
      hourlyRate: 15,
    });

    expect(employees.create).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ compensationType: 'HOURLY', hourlyRate: 15 }),
      tenantAdmin,
    );
  });

  it('generates and hashes a kiosk PIN per employee when assignKioskPins is set, returned in plaintext once', async () => {
    employees.create
      .mockResolvedValueOnce({ id: 'emp-1', employeeNumber: 'EMP-0001', firstName: 'Ama', lastName: 'Owusu' } as never)
      .mockResolvedValueOnce({ id: 'emp-2', employeeNumber: 'EMP-0002', firstName: 'Kwame', lastName: 'Mensah' } as never);
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
      'Kwame,Mensah,Designer,FULL_TIME,2026-01-02,GH',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin, undefined, true);

    expect(result.created).toBe(2);
    expect(result.kioskPins).toHaveLength(2);
    expect(result.kioskPins?.[0]).toMatchObject({ employeeId: 'emp-1', employeeNumber: 'EMP-0001', firstName: 'Ama', lastName: 'Owusu' });
    expect(result.kioskPins?.[0].pin).toMatch(/^\d{4}$/);
    expect(employeeRepository.setClockInPinHash).toHaveBeenCalledTimes(2);
    const [, storedEmployeeId, storedHash] = employeeRepository.setClockInPinHash.mock.calls[0];
    expect(storedEmployeeId).toBe('emp-1');
    expect(storedHash).not.toBe(result.kioskPins?.[0].pin);
  });

  it('omits kioskPins entirely when assignKioskPins is not set', async () => {
    employees.create.mockResolvedValue({ id: 'emp-1', employeeNumber: 'EMP-0001', firstName: 'Ama', lastName: 'Owusu' } as never);
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
    ].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.kioskPins).toBeUndefined();
    expect(employeeRepository.setClockInPinHash).not.toHaveBeenCalled();
  });

  it('rejects the whole batch up front when the actor is not authorized for the target organization', async () => {
    const csv = [
      'firstName,lastName,jobTitle,employmentType,hireDate,countryCode',
      'Ama,Owusu,Engineer,FULL_TIME,2026-01-01,GH',
    ].join('\n');

    await expect(service.import('tenant-1', 'org-1', csv, orgAdminScopedElsewhere)).rejects.toThrow(
      ForbiddenException,
    );
    expect(employees.create).not.toHaveBeenCalled();
  });
});
