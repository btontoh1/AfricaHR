import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EmploymentType } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { EmployeeBulkImportService } from './employee-bulk-import.service';
import { EmployeeService } from './employee.service';

describe('EmployeeBulkImportService', () => {
  let service: EmployeeBulkImportService;
  let employees: jest.Mocked<EmployeeService>;

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
    service = new EmployeeBulkImportService(employees);
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
    const csv = ['firstName,lastName', 'Ama,Owusu'].join('\n');

    const result = await service.import('tenant-1', 'org-1', csv, tenantAdmin);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('jobTitle');
    expect(employees.create).not.toHaveBeenCalled();
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
