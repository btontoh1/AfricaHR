import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Employee, EmploymentType, Prisma } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import {
  EmployeeRepository,
  EmploymentHistoryRepository,
  FamilyMemberRepository,
  UserAccessRepository,
} from '@africahr/employee-data-access';
import { EmploymentStatus } from '@africahr/employee-domain';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employees: jest.Mocked<EmployeeRepository>;
  let history: jest.Mocked<EmploymentHistoryRepository>;
  let familyMembers: jest.Mocked<FamilyMemberRepository>;
  let userAccess: jest.Mocked<UserAccessRepository>;
  let audit: jest.Mocked<AuditService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  function makeOrgAdmin(organizationId: string): RequestUser {
    return {
      sub: 'org-admin-1',
      email: 'orgadmin@acme.com',
      role: SystemRole.ORG_ADMIN,
      tenantId: 'tenant-1',
      organizationId,
      iat: 1,
      exp: 2,
    };
  }

  function makeEmployee(overrides: Partial<Employee> = {}): Employee {
    return {
      id: 'emp-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      organizationUnitId: null,
      userId: null,
      managerId: null,
      employeeNumber: 'EMP-0001',
      firstName: 'Ama',
      lastName: 'Owusu',
      dateOfBirth: null,
      gender: null,
      nationality: null,
      phone: null,
      personalEmail: null,
      jobTitle: 'Software Engineer',
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      hireDate: new Date('2026-01-01'),
      terminationDate: null,
      baseSalary: null,
      payFrequency: null,
      currency: null,
      annualRentPaid: null,
      countryCode: 'GH',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    };
  }

  function makeDto(overrides: Partial<CreateEmployeeDto> = {}): CreateEmployeeDto {
    return {
      organizationId: 'org-1',
      firstName: 'Ama',
      lastName: 'Owusu',
      jobTitle: 'Software Engineer',
      employmentType: EmploymentType.FULL_TIME,
      hireDate: '2026-01-01',
      countryCode: 'GH',
      ...overrides,
    };
  }

  beforeEach(() => {
    employees = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<EmployeeRepository>;

    history = {
      create: jest.fn().mockResolvedValue(undefined),
      listByEmployee: jest.fn(),
    } as unknown as jest.Mocked<EmploymentHistoryRepository>;

    familyMembers = {
      listByEmployee: jest.fn().mockResolvedValue([]),
      replaceForEmployee: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<FamilyMemberRepository>;

    userAccess = {
      deactivate: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserAccessRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new EmployeeService(employees, history, familyMembers, userAccess, audit);
  });

  describe('create', () => {
    it('auto-generates the employee number when omitted', async () => {
      employees.count.mockResolvedValue(6);
      employees.create.mockResolvedValue(makeEmployee({ employeeNumber: 'EMP-0007' }));

      await service.create('tenant-1', makeDto(), hrManager);

      expect(employees.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeNumber: 'EMP-0007' }),
      );
    });

    it('rejects an explicitly supplied invalid employee number', async () => {
      await expect(
        service.create('tenant-1', makeDto({ employeeNumber: 'not-valid' }), hrManager),
      ).rejects.toThrow(BadRequestException);
      expect(employees.create).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      employees.count.mockResolvedValue(0);
      employees.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
          meta: { constraint: 'employees_organization_id_fkey' },
        }),
      );

      await expect(service.create('tenant-1', makeDto(), hrManager)).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      employees.count.mockResolvedValue(0);
      const created = makeEmployee();
      employees.create.mockResolvedValue(created);

      await service.create('tenant-1', makeDto(), hrManager);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'employee.created', resourceId: created.id }),
      );
    });

    it('saves parents/children when provided and attaches them to the result', async () => {
      employees.count.mockResolvedValue(0);
      const created = makeEmployee();
      employees.create.mockResolvedValue(created);
      familyMembers.replaceForEmployee.mockResolvedValue([
        { id: 'fm-1', tenantId: 'tenant-1', employeeId: created.id, relationship: 'PARENT', name: 'Kofi Owusu', dateOfBirth: new Date('1970-01-01'), createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.create(
        'tenant-1',
        makeDto({ familyMembers: [{ relationship: 'PARENT', name: 'Kofi Owusu', dateOfBirth: '1970-01-01' }] }),
        hrManager,
      );

      expect(familyMembers.replaceForEmployee).toHaveBeenCalledWith('tenant-1', created.id, [
        { relationship: 'PARENT', name: 'Kofi Owusu', dateOfBirth: new Date('1970-01-01') },
      ]);
      expect(result.familyMembers).toHaveLength(1);
    });

    it('leaves family members empty when none are provided', async () => {
      employees.count.mockResolvedValue(0);
      employees.create.mockResolvedValue(makeEmployee());

      const result = await service.create('tenant-1', makeDto(), hrManager);

      expect(familyMembers.replaceForEmployee).not.toHaveBeenCalled();
      expect(result.familyMembers).toEqual([]);
    });

    it('allows an org admin to create an employee within their own organization', async () => {
      employees.count.mockResolvedValue(0);
      employees.create.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(
        service.create('tenant-1', makeDto({ organizationId: 'org-1' }), makeOrgAdmin('org-1')),
      ).resolves.toBeDefined();
    });

    it('rejects an org admin creating an employee under a different organization', async () => {
      await expect(
        service.create('tenant-1', makeDto({ organizationId: 'org-2' }), makeOrgAdmin('org-1')),
      ).rejects.toThrow(ForbiddenException);
      expect(employees.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', hrManager)).rejects.toThrow(NotFoundException);
    });

    it('allows an org admin to read an employee within their own organization', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(service.findById('tenant-1', 'emp-1', makeOrgAdmin('org-1'))).resolves.toBeDefined();
    });

    it('rejects an org admin reading an employee from a different organization', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(service.findById('tenant-1', 'emp-1', makeOrgAdmin('org-2'))).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('rejects an employee being set as their own manager', async () => {
      employees.findById.mockResolvedValue(makeEmployee());

      await expect(
        service.update('tenant-1', 'emp-1', { managerId: 'emp-1' }, hrManager),
      ).rejects.toThrow(BadRequestException);
      expect(employees.update).not.toHaveBeenCalled();
    });

    it('rejects a manager assignment that would create a reporting cycle', async () => {
      const emp1 = makeEmployee({ id: 'emp-1', managerId: null });
      const emp2 = makeEmployee({ id: 'emp-2', managerId: 'emp-1' });

      employees.findById.mockResolvedValue(emp1);
      employees.list.mockResolvedValue([emp1, emp2]);

      await expect(
        service.update('tenant-1', 'emp-1', { managerId: 'emp-2' }, hrManager),
      ).rejects.toThrow(BadRequestException);
      expect(employees.update).not.toHaveBeenCalled();
    });

    it('records a history entry when jobTitle changes', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ jobTitle: 'Engineer' }));
      employees.update.mockResolvedValue(makeEmployee({ jobTitle: 'Senior Engineer' }));

      await service.update('tenant-1', 'emp-1', { jobTitle: 'Senior Engineer' }, hrManager);

      expect(history.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          fieldName: 'jobTitle',
          oldValue: 'Engineer',
          newValue: 'Senior Engineer',
        }),
      );
    });

    it('does not record history when the field is unchanged', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ jobTitle: 'Engineer' }));
      employees.update.mockResolvedValue(makeEmployee({ jobTitle: 'Engineer' }));

      await service.update('tenant-1', 'emp-1', { jobTitle: 'Engineer' }, hrManager);

      expect(history.create).not.toHaveBeenCalled();
    });

    it('passes core profile field updates through to the repository', async () => {
      employees.findById.mockResolvedValue(makeEmployee({}));
      employees.update.mockResolvedValue(makeEmployee({ firstName: 'Ama' }));

      await service.update(
        'tenant-1',
        'emp-1',
        {
          firstName: 'Ama',
          lastName: 'Owusu',
          dateOfBirth: '1990-01-15',
          gender: 'FEMALE',
          nationality: 'Ghanaian',
          phone: '+233201234567',
          personalEmail: 'ama@example.com',
          employmentType: EmploymentType.FULL_TIME,
          hireDate: '2020-03-01',
          countryCode: 'GH',
        },
        hrManager,
      );

      expect(employees.update).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        expect.objectContaining({
          firstName: 'Ama',
          lastName: 'Owusu',
          dateOfBirth: new Date('1990-01-15'),
          gender: 'FEMALE',
          nationality: 'Ghanaian',
          phone: '+233201234567',
          personalEmail: 'ama@example.com',
          employmentType: 'FULL_TIME',
          hireDate: new Date('2020-03-01'),
          countryCode: 'GH',
          updatedBy: 'hr-1',
        }),
      );
    });

    it('clears dateOfBirth when explicitly set to null', async () => {
      employees.findById.mockResolvedValue(makeEmployee({}));
      employees.update.mockResolvedValue(makeEmployee({}));

      await service.update('tenant-1', 'emp-1', { dateOfBirth: null }, hrManager);

      expect(employees.update).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        expect.objectContaining({ dateOfBirth: null }),
      );
    });

    it('replaces family members when the update includes them', async () => {
      employees.findById.mockResolvedValue(makeEmployee({}));
      employees.update.mockResolvedValue(makeEmployee({}));

      await service.update(
        'tenant-1',
        'emp-1',
        { familyMembers: [{ relationship: 'CHILD', name: 'Yaw Owusu' }] },
        hrManager,
      );

      expect(familyMembers.replaceForEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1', [
        { relationship: 'CHILD', name: 'Yaw Owusu', dateOfBirth: undefined },
      ]);
      expect(familyMembers.listByEmployee).not.toHaveBeenCalled();
    });

    it('leaves existing family members untouched when the update omits the field', async () => {
      employees.findById.mockResolvedValue(makeEmployee({}));
      employees.update.mockResolvedValue(makeEmployee({}));

      await service.update('tenant-1', 'emp-1', { jobTitle: 'Senior Engineer' }, hrManager);

      expect(familyMembers.replaceForEmployee).not.toHaveBeenCalled();
      expect(familyMembers.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
    });

    it('rejects an org admin updating an employee from a different organization', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(
        service.update('tenant-1', 'emp-1', { jobTitle: 'Senior Engineer' }, makeOrgAdmin('org-2')),
      ).rejects.toThrow(ForbiddenException);
      expect(employees.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('rejects an illegal transition', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED }),
      );

      await expect(
        service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.ACTIVE, undefined, hrManager),
      ).rejects.toThrow(ConflictException);
      expect(employees.updateStatus).not.toHaveBeenCalled();
    });

    it('defaults terminationDate to now when transitioning to TERMINATED without one', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE }));
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.TERMINATED, undefined, hrManager);

      expect(employees.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        EmploymentStatus.TERMINATED,
        'hr-1',
        expect.any(Date),
      );
    });

    it('records a history entry and audit log on a legal transition', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE }));
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.ON_LEAVE }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.ON_LEAVE, undefined, hrManager);

      expect(history.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ changeType: 'STATUS_CHANGE', newValue: EmploymentStatus.ON_LEAVE }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'employee.status_changed' }),
      );
    });

    it('deactivates the linked portal account when transitioning to TERMINATED', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE, userId: 'user-1' }),
      );
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED, userId: 'user-1' }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.TERMINATED, undefined, hrManager);

      expect(userAccess.deactivate).toHaveBeenCalledWith('tenant-1', 'user-1', 'hr-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'employee.portal_access_deactivated',
          resourceType: 'User',
          resourceId: 'user-1',
        }),
      );
    });

    it('does not attempt to deactivate anything when the terminated employee has no linked account', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE, userId: null }),
      );
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED, userId: null }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.TERMINATED, undefined, hrManager);

      expect(userAccess.deactivate).not.toHaveBeenCalled();
    });

    it('does not deactivate portal access for transitions other than TERMINATED', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE, userId: 'user-1' }),
      );
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.SUSPENDED, userId: 'user-1' }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.SUSPENDED, undefined, hrManager);

      expect(userAccess.deactivate).not.toHaveBeenCalled();
    });

    it('rejects an org admin changing status for an employee from a different organization', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ organizationId: 'org-1', employmentStatus: EmploymentStatus.ACTIVE }),
      );

      await expect(
        service.updateStatus(
          'tenant-1',
          'emp-1',
          EmploymentStatus.ON_LEAVE,
          undefined,
          makeOrgAdmin('org-2'),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(employees.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.softDelete('tenant-1', 'missing', hrManager)).rejects.toThrow(NotFoundException);
      expect(employees.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes and records an audit entry', async () => {
      employees.findById.mockResolvedValue(makeEmployee());
      employees.softDelete.mockResolvedValue(makeEmployee({ deletedAt: new Date() }));

      const result = await service.softDelete('tenant-1', 'emp-1', hrManager);

      expect(employees.softDelete).toHaveBeenCalledWith('tenant-1', 'emp-1', 'hr-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'employee.deleted',
          resourceType: 'Employee',
          resourceId: 'emp-1',
          actorUserId: 'hr-1',
        }),
      );
      expect(result.deletedAt).not.toBeNull();
    });

    it('rejects an org admin deleting an employee from a different organization', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(service.softDelete('tenant-1', 'emp-1', makeOrgAdmin('org-2'))).rejects.toThrow(
        ForbiddenException,
      );
      expect(employees.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.getHistory('tenant-1', 'missing', hrManager)).rejects.toThrow(NotFoundException);
      expect(history.listByEmployee).not.toHaveBeenCalled();
    });

    it('returns history for an existing employee', async () => {
      employees.findById.mockResolvedValue(makeEmployee());
      history.listByEmployee.mockResolvedValue([]);

      await service.getHistory('tenant-1', 'emp-1', hrManager);

      expect(history.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
    });

    it('rejects an org admin reading history for an employee from a different organization', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ organizationId: 'org-1' }));

      await expect(service.getHistory('tenant-1', 'emp-1', makeOrgAdmin('org-2'))).rejects.toThrow(
        ForbiddenException,
      );
      expect(history.listByEmployee).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('passes through explicit filters for a tenant-wide role', async () => {
      employees.list.mockResolvedValue([]);

      await service.list('tenant-1', { organizationId: 'org-9' }, hrManager);

      expect(employees.list).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-9' });
    });

    it("forces an org admin's own organization regardless of the requested filter", async () => {
      employees.list.mockResolvedValue([]);

      await service.list('tenant-1', { organizationId: 'org-9' }, makeOrgAdmin('org-1'));

      expect(employees.list).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1' });
    });

    it("defaults to an org admin's own organization when no filter is requested", async () => {
      employees.list.mockResolvedValue([]);

      await service.list('tenant-1', {}, makeOrgAdmin('org-1'));

      expect(employees.list).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1' });
    });
  });
});
