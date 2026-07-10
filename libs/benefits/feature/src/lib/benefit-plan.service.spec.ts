import { ConflictException, NotFoundException } from '@nestjs/common';
import { BenefitPlan, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { BenefitPlanRepository } from '@africahr/benefits-data-access';
import { BenefitPlanService } from './benefit-plan.service';

describe('BenefitPlanService', () => {
  let service: BenefitPlanService;
  let plans: jest.Mocked<BenefitPlanRepository>;
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

  beforeEach(() => {
    plans = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<BenefitPlanRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new BenefitPlanService(plans, audit);
  });

  describe('create', () => {
    it('translates a duplicate code into ConflictException', async () => {
      plans.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', {
          name: 'Health',
          code: 'HEALTH',
          contributionType: 'PERCENTAGE',
          employeeContribution: 0.02,
          employerContribution: 0.03,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('records an audit entry on success', async () => {
      const created = makePlan();
      plans.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        {
          name: 'Private Health Insurance',
          code: 'HEALTH',
          contributionType: 'PERCENTAGE',
          employeeContribution: 0.02,
          employerContribution: 0.03,
        },
        'hr-1',
      );

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'benefits.plan.created', resourceId: created.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the plan does not exist', async () => {
      plans.findById.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'missing', {})).rejects.toThrow(NotFoundException);
      expect(plans.update).not.toHaveBeenCalled();
    });

    it('updates and audits on success', async () => {
      plans.findById.mockResolvedValue(makePlan());
      plans.update.mockResolvedValue(makePlan({ isActive: false }));

      await service.update('tenant-1', 'plan-1', { isActive: false }, 'hr-1');

      expect(plans.update).toHaveBeenCalledWith(
        'tenant-1',
        'plan-1',
        expect.objectContaining({ isActive: false, updatedBy: 'hr-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'benefits.plan.updated' }),
      );
    });
  });
});
