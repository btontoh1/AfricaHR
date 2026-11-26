import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceScope } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

// Signed PUT URLs are scoped to a single Content-Type (part of what's
// signed) - restricting it here to what an HR policy document reasonably
// is doubles as the only file-type enforcement this flow gets, same
// posture as RequestVerificationDocumentUploadDto.
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class CreatePolicyDto {
  @ApiProperty({ example: 'Annual Leave Policy' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ example: 'Leave', description: 'Free-form folder for the staff-facing view, e.g. Leave, Conduct, Finance' })
  @IsString()
  @Length(1, 100)
  folder!: string;

  @ApiProperty({ example: 'annual-leave-policy.pdf' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_CONTENT_TYPES })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @ApiProperty({ enum: Object.values(AudienceScope) })
  @IsEnum(AudienceScope)
  audienceScope!: AudienceScope;

  @ApiPropertyOptional({
    description: 'Required when audienceScope is ORGANIZATION; rejected otherwise.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Required when audienceScope is ORGANIZATION_UNIT; rejected otherwise.',
  })
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;

  @ApiPropertyOptional({
    description:
      'The earlier version this replaces, if any - that version is kept (not deleted) so its existing read receipts stay meaningful history.',
  })
  @IsOptional()
  @IsUUID()
  supersedesId?: string;
}
