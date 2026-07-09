import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Employee, EmploymentType, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { EmployeeRepository, EmploymentHistoryRepository } from '@africahr/employee-data-access';
import { EmploymentStatus } from '@africahr/employee-domain';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employees: jest.Mocked<EmployeeRepository>;
  let history: jest.Mocked<EmploymentHistoryRepository>;
  let audit: jest.Mocked<AuditService>;

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

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new EmployeeService(employees, history, audit);
  });

  describe('create', () => {
    it('auto-generates the employee number when omitted', async () => {
      employees.count.mockResolvedValue(6);
      employees.create.mockResolvedValue(makeEmployee({ employeeNumber: 'EMP-0007' }));

      await service.create('tenant-1', makeDto());

      expect(employees.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeNumber: 'EMP-0007' }),
      );
    });

    it('rejects an explicitly supplied invalid employee number', async () => {
      await expect(
        service.create('tenant-1', makeDto({ employeeNumber: 'not-valid' })),
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

      await expect(service.create('tenant-1', makeDto())).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      employees.count.mockResolvedValue(0);
      const created = makeEmployee();
      employees.create.mockResolvedValue(created);

      await service.create('tenant-1', makeDto(), 'hr-1');

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'employee.created', resourceId: created.id }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects an employee being set as their own manager', async () => {
      employees.findById.mockResolvedValue(makeEmployee());

      await expect(
        service.update('tenant-1', 'emp-1', { managerId: 'emp-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(employees.update).not.toHaveBeenCalled();
    });

    it('rejects a manager assignment that would create a reporting cycle', async () => {
      const emp1 = makeEmployee({ id: 'emp-1', managerId: null });
      const emp2 = makeEmployee({ id: 'emp-2', managerId: 'emp-1' });

      employees.findById.mockResolvedValue(emp1);
      employees.list.mockResolvedValue([emp1, emp2]);

      await expect(
        service.update('tenant-1', 'emp-1', { managerId: 'emp-2' }),
      ).rejects.toThrow(BadRequestException);
      expect(employees.update).not.toHaveBeenCalled();
    });

    it('records a history entry when jobTitle changes', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ jobTitle: 'Engineer' }));
      employees.update.mockResolvedValue(makeEmployee({ jobTitle: 'Senior Engineer' }));

      await service.update('tenant-1', 'emp-1', { jobTitle: 'Senior Engineer' }, 'hr-1');

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

      await service.update('tenant-1', 'emp-1', { jobTitle: 'Engineer' });

      expect(history.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('rejects an illegal transition', async () => {
      employees.findById.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED }),
      );

      await expect(
        service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.ACTIVE),
      ).rejects.toThrow(ConflictException);
      expect(employees.updateStatus).not.toHaveBeenCalled();
    });

    it('defaults terminationDate to now when transitioning to TERMINATED without one', async () => {
      employees.findById.mockResolvedValue(makeEmployee({ employmentStatus: EmploymentStatus.ACTIVE }));
      employees.updateStatus.mockResolvedValue(
        makeEmployee({ employmentStatus: EmploymentStatus.TERMINATED }),
      );

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.TERMINATED, undefined, 'hr-1');

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

      await service.updateStatus('tenant-1', 'emp-1', EmploymentStatus.ON_LEAVE);

      expect(history.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ changeType: 'STATUS_CHANGE', newValue: EmploymentStatus.ON_LEAVE }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'employee.status_changed' }),
      );
    });
  });

  describe('getHistory', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      employees.findById.mockResolvedValue(null);

      await expect(service.getHistory('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
      expect(history.listByEmployee).not.toHaveBeenCalled();
    });

    it('returns history for an existing employee', async () => {
      employees.findById.mockResolvedValue(makeEmployee());
      history.listByEmployee.mockResolvedValue([]);

      await service.getHistory('tenant-1', 'emp-1');

      expect(history.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
    });
  });
});
