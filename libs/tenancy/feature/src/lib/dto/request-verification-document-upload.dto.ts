import { ApiProperty } from '@nestjs/swagger';
import { VerificationDocumentType } from '@prisma/client';
import { IsEnum, IsIn, IsString, Length } from 'class-validator';

// Signed PUT URLs are scoped to a single Content-Type (part of what's
// signed) - restricting it here to what a scanned legal document
// reasonably is doubles as the only file-type enforcement this flow gets,
// since the API never sees the bytes themselves (they go straight from
// browser to storage).
const ALLOWED_CONTENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export class RequestVerificationDocumentUploadDto {
  @ApiProperty({ enum: Object.values(VerificationDocumentType) })
  @IsEnum(VerificationDocumentType)
  documentType!: VerificationDocumentType;

  @ApiProperty({ example: 'certificate-of-incorporation.pdf' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_CONTENT_TYPES })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;
}
