import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationRepository, CandidateRepository, JobRequisitionRepository } from '@africahr/recruitment-data-access';
import { StorageService } from '@africahr/platform-storage';
import { ApplicationService } from './application.service';
import { SubmitPublicApplicationDto } from './dto/submit-public-application.dto';
import { PublicJobRequisitionResponseDto } from './dto/public-job-requisition-response.dto';
import { PublicApplicationResponseDto } from './dto/public-application-response.dto';
import { RequestPublicResumeUploadDto } from './dto/request-public-resume-upload.dto';
import { RequestPublicIdentityDocumentUploadDto } from './dto/request-public-identity-document-upload.dto';
import { PublicDocumentUploadUrlResponseDto } from './dto/public-document-upload-url-response.dto';

const NOT_ACCEPTING_APPLICATIONS = 'This job posting is no longer accepting applications';
const RESUME_PREFIX = 'resumes';
const IDENTITY_DOCUMENT_PREFIX = 'identity-documents';

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
 *
 * Resume/identity-document upload follows the same "browser talks to
 * storage directly, API only ever hands out a key" shape as
 * OrganizationVerificationDocumentService.requestUpload, with one
 * difference: there's no Candidate/Application row yet to attach a
 * storage key to when the upload happens (the applicant hasn't submitted
 * the form yet), so the key is minted statelessly here and only persisted
 * once apply() actually creates the Application.
 */
@Injectable()
export class PublicApplicationService {
  constructor(
    private readonly requisitions: JobRequisitionRepository,
    private readonly candidates: CandidateRepository,
    private readonly applications: ApplicationService,
    private readonly applicationRepository: ApplicationRepository,
    private readonly storage: StorageService,
  ) {}

  async getOpenRequisition(requisitionId: string): Promise<PublicJobRequisitionResponseDto> {
    const requisition = await this.requireOpenRequisition(requisitionId);

    return {
      id: requisition.id,
      title: requisition.title,
      description: requisition.description,
      employmentType: requisition.employmentType,
    };
  }

  async requestResumeUpload(
    requisitionId: string,
    dto: RequestPublicResumeUploadDto,
  ): Promise<PublicDocumentUploadUrlResponseDto> {
    const requisition = await this.requireOpenRequisition(requisitionId);
    return this.mintUploadUrl(requisition.tenantId, RESUME_PREFIX, dto.fileName, dto.contentType);
  }

  async requestIdentityDocumentUpload(
    requisitionId: string,
    dto: RequestPublicIdentityDocumentUploadDto,
  ): Promise<PublicDocumentUploadUrlResponseDto> {
    const requisition = await this.requireOpenRequisition(requisitionId);
    return this.mintUploadUrl(requisition.tenantId, IDENTITY_DOCUMENT_PREFIX, dto.fileName, dto.contentType);
  }

  async apply(
    requisitionId: string,
    dto: SubmitPublicApplicationDto,
  ): Promise<PublicApplicationResponseDto> {
    const requisition = await this.requireOpenRequisition(requisitionId);
    const tenantId = requisition.tenantId;

    // Storage keys are only ever accepted if they carry this tenant's own
    // prefix, minted moments earlier by this same service - defense in
    // depth against a tampered request pointing at an arbitrary key (see
    // this class's doc comment; matches the "narrow, auditable" posture
    // RLS_CONVENTION.md asks for elsewhere in this flow).
    this.assertOwnedStorageKey(tenantId, RESUME_PREFIX, dto.resumeStorageKey);
    this.assertOwnedStorageKey(tenantId, IDENTITY_DOCUMENT_PREFIX, dto.identityDocumentStorageKey);

    const candidate = await this.findOrCreateCandidate(tenantId, dto);

    const application = await this.applications.create(tenantId, {
      candidateId: candidate.id,
      requisitionId,
    });

    if (dto.resumeStorageKey || dto.identityDocumentStorageKey) {
      await this.applicationRepository.update(tenantId, application.id, {
        resumeStorageKey: dto.resumeStorageKey,
        resumeFileName: dto.resumeFileName,
        identityDocumentStorageKey: dto.identityDocumentStorageKey,
        identityDocumentFileName: dto.identityDocumentFileName,
        identityDocumentType: dto.identityDocumentType,
      });
    }

    return { applicationId: application.id };
  }

  private async requireOpenRequisition(requisitionId: string) {
    const requisition = await this.requisitions.findOpenByIdAcrossTenants(requisitionId);
    if (!requisition) {
      throw new NotFoundException(NOT_ACCEPTING_APPLICATIONS);
    }
    return requisition;
  }

  private async mintUploadUrl(
    tenantId: string,
    prefix: string,
    fileName: string,
    contentType: string,
  ): Promise<PublicDocumentUploadUrlResponseDto> {
    const storageKey = `${prefix}/${tenantId}/${randomUUID()}-${fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(storageKey, contentType);
    return { uploadUrl, storageKey };
  }

  private assertOwnedStorageKey(tenantId: string, prefix: string, storageKey?: string): void {
    if (storageKey && !storageKey.startsWith(`${prefix}/${tenantId}/`)) {
      throw new BadRequestException('Invalid upload reference');
    }
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
