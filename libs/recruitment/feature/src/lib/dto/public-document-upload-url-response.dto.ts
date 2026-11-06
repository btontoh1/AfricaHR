import { ApiProperty } from '@nestjs/swagger';

/** Shared by both the resume and identity-document upload-url endpoints — identical shape, no reason to duplicate. */
export class PublicDocumentUploadUrlResponseDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  storageKey!: string;
}
