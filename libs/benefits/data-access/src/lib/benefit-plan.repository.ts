import { Injectable } from '@nestjs/common';
import { BenefitContributionType, BenefitPlan, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateBenefitPlanInput {
  name: string;
  code: string;
  description?: string;
  contributionType: BenefitContributionType;
  employeeContribution: Prisma.Decimal | number;
  employerContribution: Prisma.Decimal | number;
  createdBy?: string;
}

export interface UpdateBenefitPlanInput {
  name?: string;
  description?: string;
  contributionType?: BenefitContributionType;
  employeeContribution?: Prisma.Decimal | number;
  employerContribution?: Prisma.Decimal | number;
  isActive?: boolean;
  updatedBy?: string;
}

export interface ListBenefitPlansParams {
  activeOnly?: boolean;
}

@Injectable()
export class BenefitPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateBenefitPlanInput): Promise<BenefitPlan> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitPlan.create({
        data: {
          tenantId,
          name: input.name,
          code: input.code,
          description: input.description,
          contributionType: input.contributionType,
          employeeContribution: input.employeeContribution,
          employerContribution: input.employerContribution,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<BenefitPlan | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitPlan.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListBenefitPlansParams = {}): Promise<BenefitPlan[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitPlan.findMany({
        where: { tenantId, deletedAt: null, isActive: params.activeOnly ? true : undefined },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateBenefitPlanInput): Promise<BenefitPlan> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitPlan.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          contributionType: input.contributionType,
          employeeContribution: input.employeeContribution,
          employerContribution: input.employerContribution,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
