import { Injectable } from '@nestjs/common';
import { EmploymentType, JobRequisition, JobRequisitionStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateJobRequisitionInput {
  organizationId: string;
  organizationUnitId?: string;
  hiringManagerId?: string;
  title: string;
  description?: string;
  employmentType: EmploymentType;
  openings?: number;
  targetHireDate?: Date;
  createdBy?: string;
}

export interface UpdateJobRequisitionInput {
  title?: string;
  description?: string;
  organizationUnitId?: string | null;
  hiringManagerId?: string | null;
  openings?: number;
  status?: JobRequisitionStatus;
  targetHireDate?: Date | null;
  updatedBy?: string;
}

export interface ListJobRequisitionsParams {
  organizationId?: string;
  hiringManagerId?: string;
  status?: JobRequisitionStatus;
}

@Injectable()
export class JobRequisitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateJobRequisitionInput): Promise<JobRequisition> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.jobRequisition.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          organizationUnitId: input.organizationUnitId,
          hiringManagerId: input.hiringManagerId,
          title: input.title,
          description: input.description,
          employmentType: input.employmentType,
          openings: input.openings,
          targetHireDate: input.targetHireDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<JobRequisition | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.jobRequisition.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListJobRequisitionsParams = {}): Promise<JobRequisition[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.jobRequisition.findMany({
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          hiringManagerId: params.hiringManagerId,
          status: params.status,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    input: UpdateJobRequisitionInput,
  ): Promise<JobRequisition> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.jobRequisition.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          organizationUnitId: input.organizationUnitId,
          hiringManagerId: input.hiringManagerId,
          openings: input.openings,
          status: input.status,
          targetHireDate: input.targetHireDate,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
