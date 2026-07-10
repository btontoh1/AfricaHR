import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BenefitEnrollment, BenefitPlan, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BenefitEnrollmentRepository,
  BenefitEnrollmentWithPlan,
  BenefitPlanRepository,
  BenefitsEmployeeRepository,
} from '@africahr/benefits-data-access';
import { BenefitEnrollmentService } from './benefit-enrollment.service';

describe('BenefitEnrollmentService', () => {
  let service: BenefitEnrollmentService;
  let enrollments: jest.Mocked<BenefitEnrollmentRepository>;
  let plans: jest.Mocked<BenefitPlanRepository>;
  let employees: jest.Mocked<BenefitsEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  function makePlan(overrides: Partial<BenefitPlan> = {}): BenefitPlan {
    return {
      id: 'plan-1',
      tenantId: 'tenant-1',
      name: 'Private Health Insurance',
      code: 'HEALTH',
      description: null,
      contributionType: 'PERCENTAGE',
      employeeContribution: new Prisma.Decimal(0.02),
      employerContribution: new Prisma.Decimal(0.03),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as BenefitPlan;
  }

  function makeEnrollment(overrides: Partial<BenefitEnrollmentWithPlan> = {}): BenefitEnrollmentWithPlan {
    return {
      id: 'enr-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      benefitPlanId: 'plan-1',
      status: 'ACTIVE',
      effectiveDate: new Date('2026-03-01'),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      benefitPlan: makePlan(),
      ...overrides,
    } as BenefitEnrollmentWithPlan;
  }

  beforeEach(() => {
    enrollments = {
      create: jest.fn(),
      findById: jest.fn(),
      findActiveByEmployeeAndPlan: jest.fn().mockResolvedValue(null),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<BenefitEnrollmentRepository>;

    plans = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(makePlan()),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<BenefitPlanRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: 'emp-1', userId: 'user-1', baseSalary: new Prisma.Decimal(3000) }),
    } as unknown as jest.Mocked<BenefitsEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new BenefitEnrollmentService(enrollments, plans, employees, audit);
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('enroll', () => {
    it('throws NotFoundException when the plan does not exist', async () => {
      plans.findById.mockResolvedValue(null);

      await expect(service.enroll('tenant-1', 'emp-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('rejects enrolling in an inactive plan', async () => {
      plans.findById.mockResolvedValue(makePlan({ isActive: false }));

      await expect(service.enroll('tenant-1', 'emp-1', 'plan-1')).rejects.toThrow(ConflictException);
    });

    it('rejects enrolling twice in the same plan', async () => {
      enrollments.findActiveByEmployeeAndPlan.mockResolvedValue(makeEnrollment());

      await expect(service.enroll('tenant-1', 'emp-1', 'plan-1')).rejects.toThrow(ConflictException);
      expect(enrollments.create).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation on employeeId into NotFoundException', async () => {
      enrollments.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(service.enroll('tenant-1', 'missing-emp', 'plan-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the enrollment and audits on success', async () => {
      const created = { id: 'enr-1' } as BenefitEnrollment;
      enrollments.create.mockResolvedValue(created);

      await service.enroll('tenant-1', 'emp-1', 'plan-1', '2026-03-01', 'hr-1');

      expect(enrollments.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', benefitPlanId: 'plan-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'benefits.enrollment.created', resourceId: 'enr-1' }),
      );
    });
  });

  describe('cancelForSelf', () => {
    it('does not reveal an enrollment belonging to a different employee', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1', baseSalary: null });
      enrollments.findById.mockResolvedValue(makeEnrollment({ employeeId: 'someone-else' }));

      await expect(service.cancelForSelf('tenant-1', 'user-1', 'enr-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('rejects cancelling an already-cancelled enrollment', async () => {
      enrollments.findById.mockResolvedValue(makeEnrollment({ status: 'CANCELLED' }));

      await expect(service.cancel('tenant-1', 'enr-1')).rejects.toThrow(ConflictException);
    });

    it('cancels and audits on success', async () => {
      enrollments.findById.mockResolvedValue(makeEnrollment());
      enrollments.updateStatus.mockResolvedValue({ id: 'enr-1', status: 'CANCELLED' } as BenefitEnrollment);

      await service.cancel('tenant-1', 'enr-1', 'hr-1');

      expect(enrollments.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'enr-1',
        'CANCELLED',
        expect.any(Date),
        'hr-1',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'benefits.enrollment.cancelled' }),
      );
    });
  });

  describe('getContribution', () => {
    it('throws NotFoundException when the employee no longer exists', async () => {
      enrollments.findById.mockResolvedValue(makeEnrollment());
      employees.findById.mockResolvedValue(null);

      await expect(service.getContribution('tenant-1', 'enr-1')).rejects.toThrow(NotFoundException);
    });

    it('computes the live PERCENTAGE contribution from the plan rates and current base salary', async () => {
      enrollments.findById.mockResolvedValue(
        makeEnrollment({
          benefitPlan: makePlan({
            contributionType: 'PERCENTAGE',
            employeeContribution: new Prisma.Decimal(0.02),
            employerContribution: new Prisma.Decimal(0.03),
          }),
        }),
      );
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', baseSalary: new Prisma.Decimal(3000) });

      const result = await service.getContribution('tenant-1', 'enr-1');

      expect(result).toEqual({ employee: 60, employer: 90 });
    });

    it('treats a null baseSalary as 0', async () => {
      enrollments.findById.mockResolvedValue(makeEnrollment());
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', baseSalary: null });

      const result = await service.getContribution('tenant-1', 'enr-1');

      expect(result).toEqual({ employee: 0, employer: 0 });
    });
  });
});
