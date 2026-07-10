import { Injectable, NotFoundException } from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { CandidateRepository } from '@africahr/recruitment-data-access';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(
    private readonly candidates: CandidateRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateCandidateDto, actorId?: string): Promise<Candidate> {
    const candidate = await this.candidates.create(tenantId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      source: dto.source,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.candidate.created',
      resourceType: 'Candidate',
      resourceId: candidate.id,
    });

    return candidate;
  }

  async findById(tenantId: string, id: string): Promise<Candidate> {
    const candidate = await this.candidates.findById(tenantId, id);
    if (!candidate) {
      throw new NotFoundException(`Candidate "${id}" not found`);
    }
    return candidate;
  }

  list(tenantId: string, params: { email?: string } = {}): Promise<Candidate[]> {
    return this.candidates.list(tenantId, params);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCandidateDto,
    actorId?: string,
  ): Promise<Candidate> {
    await this.findById(tenantId, id);

    const updated = await this.candidates.update(tenantId, id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      source: dto.source,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.candidate.updated',
      resourceType: 'Candidate',
      resourceId: id,
    });

    return updated;
  }
}
