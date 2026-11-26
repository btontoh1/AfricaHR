import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceScope } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

// Signed PUT URLs are scoped to a single Content-Type - restricting it here
// to a reasonable "picture or attachment" set, same posture as
// CreatePolicyDto's ALLOWED_CONTENT_TYPES.
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Office closed Friday' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ example: 'The office will be closed for the public holiday on Friday.' })
  @IsString()
  @Length(1, 5000)
  body!: string;

  @ApiPropertyOptional({ example: 'notice.pdf', description: 'Required together with attachmentContentType; omit for no attachment.' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  attachmentFileName?: string;

  @ApiPropertyOptional({ enum: ALLOWED_CONTENT_TYPES })
  @IsOptional()
  @IsIn(ALLOWED_CONTENT_TYPES)
  attachmentContentType?: string;

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

  @ApiPropertyOptional({ description: 'Pinned posts sort first in every feed.' })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
