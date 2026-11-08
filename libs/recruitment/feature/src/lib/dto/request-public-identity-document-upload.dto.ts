import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

// A government ID is typically a photo or scan, not a word-processor
// document - same reasoning as RequestVerificationDocumentUploadDto's
// ALLOWED_CONTENT_TYPES, which this mirrors exactly.
const ALLOWED_IDENTITY_DOCUMENT_CONTENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export class RequestPublicIdentityDocumentUploadDto {
  @ApiProperty({ example: 'ghana-card-front.jpg' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_IDENTITY_DOCUMENT_CONTENT_TYPES })
  @IsIn(ALLOWED_IDENTITY_DOCUMENT_CONTENT_TYPES)
  contentType!: string;
}
