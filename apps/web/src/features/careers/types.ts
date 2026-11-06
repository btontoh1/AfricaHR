import type { components } from '@/lib/api-types';

export type { PublicJobRequisition } from '@/lib/public-job-requisition-lookup';
export type SubmitPublicApplicationInput = components['schemas']['SubmitPublicApplicationDto'];
export type PublicApplicationResponse = components['schemas']['PublicApplicationResponseDto'];
export type RequestPublicResumeUploadInput = components['schemas']['RequestPublicResumeUploadDto'];
export type RequestPublicIdentityDocumentUploadInput =
  components['schemas']['RequestPublicIdentityDocumentUploadDto'];
export type PublicDocumentUploadUrlResponse = components['schemas']['PublicDocumentUploadUrlResponseDto'];
export type IdentityDocumentType = NonNullable<SubmitPublicApplicationInput['identityDocumentType']>;
