import { Injectable } from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  createdBy?: string;
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  updatedBy?: string;
}

export interface ListCandidatesParams {
  email?: string;
}

@Injectable()
export class CandidateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateCandidateInput): Promise<Candidate> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.candidate.create({
        data: {
          tenantId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Candidate | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.candidate.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListCandidatesParams = {}): Promise<Candidate[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.candidate.findMany({
        where: { tenantId, deletedAt: null, email: params.email },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateCandidateInput): Promise<Candidate> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.candidate.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
