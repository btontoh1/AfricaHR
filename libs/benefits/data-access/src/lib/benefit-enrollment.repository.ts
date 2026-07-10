import { Injectable } from '@nestjs/common';
import { BenefitEnrollment, BenefitEnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateBenefitEnrollmentInput {
  employeeId: string;
  benefitPlanId: string;
  effectiveDate: Date;
  createdBy?: string;
}

export interface ListBenefitEnrollmentsParams {
  employeeId?: string;
  benefitPlanId?: string;
  status?: BenefitEnrollmentStatus;
}

export type BenefitEnrollmentWithPlan = Prisma.BenefitEnrollmentGetPayload<{
  include: { benefitPlan: true };
}>;

@Injectable()
export class BenefitEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateBenefitEnrollmentInput): Promise<BenefitEnrollment> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          benefitPlanId: input.benefitPlanId,
          effectiveDate: input.effectiveDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<BenefitEnrollmentWithPlan | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { benefitPlan: true },
      }),
    );
  }

  findActiveByEmployeeAndPlan(
    tenantId: string,
    employeeId: string,
    benefitPlanId: string,
  ): Promise<BenefitEnrollment | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.findFirst({
        where: { tenantId, employeeId, benefitPlanId, status: 'ACTIVE', deletedAt: null },
      }),
    );
  }

  list(
    tenantId: string,
    params: ListBenefitEnrollmentsParams = {},
  ): Promise<BenefitEnrollmentWithPlan[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.findMany({
        where: {
          tenantId,
          deletedAt: null,
          employeeId: params.employeeId,
          benefitPlanId: params.benefitPlanId,
          status: params.status,
        },
        include: { benefitPlan: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: BenefitEnrollmentStatus,
    endDate?: Date,
    updatedBy?: string,
  ): Promise<BenefitEnrollment> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.update({ where: { id }, data: { status, endDate, updatedBy } }),
    );
  }
}
