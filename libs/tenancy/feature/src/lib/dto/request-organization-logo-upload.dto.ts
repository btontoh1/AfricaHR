import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

// Same enforcement approach as RequestTenantLogoUploadDto: the signed PUT
// URL is scoped to a single Content-Type, and the API never sees the file
// bytes, so this allowlist is the only file-type check this flow gets.
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export class RequestOrganizationLogoUploadDto {
  @ApiProperty({ example: 'logo.png' })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_CONTENT_TYPES })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;
}
