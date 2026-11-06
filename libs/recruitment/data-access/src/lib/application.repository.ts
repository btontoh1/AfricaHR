import { Injectable } from '@nestjs/common';
import { Application, ApplicationStage, IdentityDocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateApplicationInput {
  candidateId: string;
  requisitionId: string;
  createdBy?: string;
}

export interface UpdateApplicationInput {
  stage?: ApplicationStage;
  notes?: string;
  rejectionReason?: string;
  offeredSalary?: Prisma.Decimal | number;
  offeredStartDate?: Date;
  offerSentAt?: Date;
  offerRespondedAt?: Date;
  offerAccepted?: boolean;
  hiredEmployeeId?: string;
  resumeStorageKey?: string;
  resumeFileName?: string;
  identityDocumentStorageKey?: string;
  identityDocumentFileName?: string;
  identityDocumentType?: IdentityDocumentType;
  updatedBy?: string;
}

export interface ListApplicationsParams {
  candidateId?: string;
  requisitionId?: string;
  stage?: ApplicationStage;
}

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: { candidate: true; requisition: true };
}>;

@Injectable()
export class ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateApplicationInput): Promise<Application> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.create({
        data: {
          tenantId,
          candidateId: input.candidateId,
          requisitionId: input.requisitionId,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<ApplicationWithRelations | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { candidate: true, requisition: true },
      }),
    );
  }

  findByCandidateAndRequisition(
    tenantId: string,
    candidateId: string,
    requisitionId: string,
  ): Promise<Application | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.findFirst({
        where: { tenantId, candidateId, requisitionId, deletedAt: null },
      }),
    );
  }

  list(
    tenantId: string,
    params: ListApplicationsParams = {},
  ): Promise<ApplicationWithRelations[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.findMany({
        where: {
          tenantId,
          deletedAt: null,
          candidateId: params.candidateId,
          requisitionId: params.requisitionId,
          stage: params.stage,
        },
        include: { candidate: true, requisition: true },
        orderBy: { appliedAt: 'desc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateApplicationInput): Promise<Application> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.update({
        where: { id },
        data: {
          stage: input.stage,
          notes: input.notes,
          rejectionReason: input.rejectionReason,
          offeredSalary: input.offeredSalary,
          offeredStartDate: input.offeredStartDate,
          offerSentAt: input.offerSentAt,
          offerRespondedAt: input.offerRespondedAt,
          offerAccepted: input.offerAccepted,
          hiredEmployeeId: input.hiredEmployeeId,
          resumeStorageKey: input.resumeStorageKey,
          resumeFileName: input.resumeFileName,
          identityDocumentStorageKey: input.identityDocumentStorageKey,
          identityDocumentFileName: input.identityDocumentFileName,
          identityDocumentType: input.identityDocumentType,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
