import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

// Signed PUT URLs are scoped to a single Content-Type (part of what's
// signed) - restricting it here is the only file-type enforcement this
// flow gets, since the API never sees the bytes themselves (they go
// straight from browser to storage). Mirrors
// RequestVerificationDocumentUploadDto's ALLOWED_CONTENT_TYPES pattern.
const ALLOWED_RESUME_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class RequestPublicResumeUploadDto {
  @ApiProperty({ example: 'kwame-mensah-resume.pdf' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_RESUME_CONTENT_TYPES })
  @IsIn(ALLOWED_RESUME_CONTENT_TYPES)
  contentType!: string;
}
