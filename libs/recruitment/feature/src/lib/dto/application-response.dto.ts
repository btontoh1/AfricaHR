import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStage, IdentityDocumentType } from '@prisma/client';
import { CandidateResponseDto } from './candidate-response.dto';
import { JobRequisitionResponseDto } from './job-requisition-response.dto';

// Flat shape returned by mutations (create/advance/sendOffer/respondToOffer/
// linkHiredEmployee) — these don't include the nested candidate/requisition
// (see ApplicationRepository.create/update, which return the plain Prisma
// row, not the `include: { candidate, requisition }` payload). Same nuance
// as Benefits' BenefitEnrollmentResponseDto in Module 7.
export class ApplicationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() candidateId!: string;
  @ApiProperty() requisitionId!: string;
  @ApiProperty({ enum: Object.values(ApplicationStage) }) stage!: ApplicationStage;
  @ApiProperty() appliedAt!: string;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiPropertyOptional({ nullable: true }) rejectionReason?: string | null;
  @ApiPropertyOptional({ nullable: true }) offeredSalary?: string | null;
  @ApiPropertyOptional({ nullable: true }) offeredStartDate?: string | null;
  @ApiPropertyOptional({ nullable: true }) offerSentAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) offerRespondedAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) offerAccepted?: boolean | null;
  @ApiPropertyOptional({ nullable: true }) hiredEmployeeId?: string | null;
  // Deliberately no resumeStorageKey/identityDocumentStorageKey field —
  // same reasoning as OrganizationVerificationDocumentResponseDto omitting
  // storageKey. The client only ever gets the file name, and fetches a
  // fresh short-lived view URL on demand (see ApplicationController's
  // resume-view-url / identity-document-view-url routes).
  @ApiPropertyOptional({ nullable: true }) resumeFileName?: string | null;
  @ApiPropertyOptional({ nullable: true }) identityDocumentFileName?: string | null;
  @ApiPropertyOptional({ enum: Object.values(IdentityDocumentType), nullable: true })
  identityDocumentType?: IdentityDocumentType | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

// Shape returned by findById/list, which query with
// `include: { candidate: true, requisition: true }`.
export class ApplicationWithRelationsResponseDto extends ApplicationResponseDto {
  @ApiProperty({ type: CandidateResponseDto }) candidate!: CandidateResponseDto;
  @ApiProperty({ type: JobRequisitionResponseDto }) requisition!: JobRequisitionResponseDto;
}
