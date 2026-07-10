import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BenefitPlan, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { BenefitPlanRepository } from '@africahr/benefits-data-access';
import { CreateBenefitPlanDto } from './dto/create-benefit-plan.dto';
import { UpdateBenefitPlanDto } from './dto/update-benefit-plan.dto';

@Injectable()
export class BenefitPlanService {
  constructor(
    private readonly plans: BenefitPlanRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateBenefitPlanDto, actorId?: string): Promise<BenefitPlan> {
    let plan: BenefitPlan;
    try {
      plan = await this.plans.create(tenantId, {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        contributionType: dto.contributionType,
        employeeContribution: dto.employeeContribution,
        employerContribution: dto.employerContribution,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Benefit plan code "${dto.code}" already exists`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'benefits.plan.created',
      resourceType: 'BenefitPlan',
      resourceId: plan.id,
    });

    return plan;
  }

  async findById(tenantId: string, id: string): Promise<BenefitPlan> {
    const plan = await this.plans.findById(tenantId, id);
    if (!plan) {
      throw new NotFoundException(`Benefit plan "${id}" not found`);
    }
    return plan;
  }

  list(tenantId: string, params: { activeOnly?: boolean } = {}): Promise<BenefitPlan[]> {
    return this.plans.list(tenantId, params);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateBenefitPlanDto,
    actorId?: string,
  ): Promise<BenefitPlan> {
    await this.findById(tenantId, id);

    const updated = await this.plans.update(tenantId, id, {
      name: dto.name,
      description: dto.description,
      contributionType: dto.contributionType,
      employeeContribution: dto.employeeContribution,
      employerContribution: dto.employerContribution,
      isActive: dto.isActive,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'benefits.plan.updated',
      resourceType: 'BenefitPlan',
      resourceId: id,
    });

    return updated;
  }
}
