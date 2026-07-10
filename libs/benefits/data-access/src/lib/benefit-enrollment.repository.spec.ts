import { PrismaService } from '@africahr/platform-database';
import { BenefitEnrollmentRepository } from './benefit-enrollment.repository';

describe('BenefitEnrollmentRepository', () => {
  let repository: BenefitEnrollmentRepository;
  let tx: {
    benefitEnrollment: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      benefitEnrollment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new BenefitEnrollmentRepository(prisma as unknown as PrismaService);
  });

  it('creates an enrollment within the tenant context', async () => {
    const effectiveDate = new Date('2026-03-01');

    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      benefitPlanId: 'plan-1',
      effectiveDate,
      createdBy: 'emp-1-user',
    });

    expect(tx.benefitEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        benefitPlanId: 'plan-1',
        effectiveDate,
      }),
    });
  });

  it('finds an active enrollment for an employee and plan', async () => {
    await repository.findActiveByEmployeeAndPlan('tenant-1', 'emp-1', 'plan-1');

    expect(tx.benefitEnrollment.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        benefitPlanId: 'plan-1',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  });

  it('lists enrollments filtered by employeeId, including the plan', async () => {
    await repository.list('tenant-1', { employeeId: 'emp-1' });

    expect(tx.benefitEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        employeeId: 'emp-1',
        benefitPlanId: undefined,
        status: undefined,
      },
      include: { benefitPlan: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status with an optional endDate', async () => {
    const endDate = new Date('2026-06-01');

    await repository.updateStatus('tenant-1', 'enr-1', 'CANCELLED', endDate, 'emp-1-user');

    expect(tx.benefitEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'enr-1' },
      data: { status: 'CANCELLED', endDate, updatedBy: 'emp-1-user' },
    });
  });
});
