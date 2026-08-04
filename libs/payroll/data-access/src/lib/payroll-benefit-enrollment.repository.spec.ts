import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { PayrollBenefitEnrollmentRepository } from './payroll-benefit-enrollment.repository';

describe('PayrollBenefitEnrollmentRepository', () => {
  let repository: PayrollBenefitEnrollmentRepository;
  let tx: { benefitEnrollment: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { benefitEnrollment: { findMany: jest.fn().mockResolvedValue([]) } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollBenefitEnrollmentRepository(prisma as unknown as PrismaService);
  });

  it('queries only active, non-deleted, already-effective enrollments for the employee', async () => {
    const asOf = new Date('2026-08-04');

    await repository.listActiveForEmployee('tenant-1', 'emp-1', asOf);

    expect(tx.benefitEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        status: 'ACTIVE',
        deletedAt: null,
        effectiveDate: { lte: asOf },
      },
      select: {
        benefitPlan: {
          select: { contributionType: true, employeeContribution: true, employerContribution: true },
        },
      },
    });
  });

  it("returns each enrollment's plan rates, unwrapped from the relation", async () => {
    tx.benefitEnrollment.findMany.mockResolvedValue([
      {
        benefitPlan: {
          contributionType: 'PERCENTAGE',
          employeeContribution: new Prisma.Decimal(0.02),
          employerContribution: new Prisma.Decimal(0.03),
        },
      },
      {
        benefitPlan: {
          contributionType: 'FIXED',
          employeeContribution: new Prisma.Decimal(50),
          employerContribution: new Prisma.Decimal(100),
        },
      },
    ]);

    const result = await repository.listActiveForEmployee('tenant-1', 'emp-1', new Date());

    expect(result).toEqual([
      {
        contributionType: 'PERCENTAGE',
        employeeContribution: new Prisma.Decimal(0.02),
        employerContribution: new Prisma.Decimal(0.03),
      },
      {
        contributionType: 'FIXED',
        employeeContribution: new Prisma.Decimal(50),
        employerContribution: new Prisma.Decimal(100),
      },
    ]);
  });

  it('returns an empty array when the employee has no active enrollments', async () => {
    const result = await repository.listActiveForEmployee('tenant-1', 'emp-1', new Date());

    expect(result).toEqual([]);
  });
});
