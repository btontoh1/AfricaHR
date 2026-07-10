import { PrismaService } from '@africahr/platform-database';
import { BenefitPlanRepository } from './benefit-plan.repository';

describe('BenefitPlanRepository', () => {
  let repository: BenefitPlanRepository;
  let tx: { benefitPlan: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      benefitPlan: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new BenefitPlanRepository(prisma as unknown as PrismaService);
  });

  it('creates a plan within the tenant context', async () => {
    await repository.create('tenant-1', {
      name: 'Private Health Insurance',
      code: 'HEALTH',
      contributionType: 'PERCENTAGE',
      employeeContribution: 0.02,
      employerContribution: 0.03,
      createdBy: 'hr-1',
    });

    expect(tx.benefitPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Private Health Insurance',
        code: 'HEALTH',
        contributionType: 'PERCENTAGE',
      }),
    });
  });

  it('lists only active plans when activeOnly is set', async () => {
    await repository.list('tenant-1', { activeOnly: true });

    expect(tx.benefitPlan.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  });
});
