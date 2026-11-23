import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

// Same enforcement approach as RequestOrganizationLogoUploadDto.
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export class RequestOrganizationSecondaryLogoUploadDto {
  @ApiProperty({ example: 'iata.png' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_CONTENT_TYPES })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;
}
