import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateRepository, JobRequisitionRepository } from '@africahr/recruitment-data-access';
import { ApplicationService } from './application.service';
import { SubmitPublicApplicationDto } from './dto/submit-public-application.dto';
import { PublicJobRequisitionResponseDto } from './dto/public-job-requisition-response.dto';
import { PublicApplicationResponseDto } from './dto/public-application-response.dto';

const NOT_ACCEPTING_APPLICATIONS = 'This job posting is no longer accepting applications';

/**
 * Backs the public, unauthenticated careers-page flow (PublicApplicationController)
 * — a candidate who has never logged in, opening a link a company embedded
 * on its own website. Every lookup starts from the requisition id alone,
 * since no tenant is known until JobRequisitionRepository.findOpenByIdAcrossTenants
 * resolves one (RLS_CONVENTION.md §5). Deliberately thin: candidate
 * dedup-by-email is the only logic that doesn't already exist elsewhere —
 * application creation reuses ApplicationService.create() as-is, so the
 * dedup check, audit record, and hiring-manager notification all stay in
 * one place rather than being duplicated for this second entry point.
 */
@Injectable()
export class PublicApplicationService {
  constructor(
    private readonly requisitions: JobRequisitionRepository,
    private readonly candidates: CandidateRepository,
    private readonly applications: ApplicationService,
  ) {}

  async getOpenRequisition(requisitionId: string): Promise<PublicJobRequisitionResponseDto> {
    const requisition = await this.requisitions.findOpenByIdAcrossTenants(requisitionId);
    if (!requisition) {
      throw new NotFoundException(NOT_ACCEPTING_APPLICATIONS);
    }

    return {
      id: requisition.id,
      title: requisition.title,
      description: requisition.description,
      employmentType: requisition.employmentType,
    };
  }

  async apply(
    requisitionId: string,
    dto: SubmitPublicApplicationDto,
  ): Promise<PublicApplicationResponseDto> {
    const requisition = await this.requisitions.findOpenByIdAcrossTenants(requisitionId);
    if (!requisition) {
      throw new NotFoundException(NOT_ACCEPTING_APPLICATIONS);
    }
    const tenantId = requisition.tenantId;

    const candidate = await this.findOrCreateCandidate(tenantId, dto);

    const application = await this.applications.create(tenantId, {
      candidateId: candidate.id,
      requisitionId,
    });

    return { applicationId: application.id };
  }

  /** Reuses an existing candidate by email within the same tenant, so re-applying to a second open role doesn't fork into a duplicate Candidate row. */
  private async findOrCreateCandidate(tenantId: string, dto: SubmitPublicApplicationDto) {
    const existing = await this.candidates.list(tenantId, { email: dto.email });
    if (existing[0]) {
      return existing[0];
    }

    return this.candidates.create(tenantId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      source: 'Company careers page',
    });
  }
}
