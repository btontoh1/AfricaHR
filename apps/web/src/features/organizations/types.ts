import type { components } from '@/lib/api-types';

export type Organization = components['schemas']['OrganizationResponseDto'];
export type OrganizationUnit = components['schemas']['OrganizationUnitResponseDto'];
export type CreateOrganizationInput = components['schemas']['CreateOrganizationDto'];
export type UpdateOrganizationInput = components['schemas']['UpdateOrganizationDto'];
export type CreateOrganizationUnitInput = components['schemas']['CreateOrganizationUnitDto'];
export type UpdateOrganizationUnitInput = components['schemas']['UpdateOrganizationUnitDto'];
export type OrganizationVerificationStatus = Organization['verificationStatus'];
export type VerificationDocument = components['schemas']['OrganizationVerificationDocumentResponseDto'];
export type RequestVerificationDocumentUploadInput = components['schemas']['RequestVerificationDocumentUploadDto'];
export type RejectOrganizationInput = components['schemas']['RejectOrganizationDto'];
export type RequestOrganizationLogoUploadInput = components['schemas']['RequestOrganizationLogoUploadDto'];
