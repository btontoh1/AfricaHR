import { ApiProperty } from '@nestjs/swagger';
import { VerificationDocumentType } from '@prisma/client';

export class OrganizationVerificationDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ enum: Object.values(VerificationDocumentType) })
  documentType!: VerificationDocumentType;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  createdAt!: string;
}
