import { ApiProperty } from '@nestjs/swagger';

export class RequestOrganizationLogoUploadResponseDto {
  @ApiProperty({ description: 'Short-lived signed URL — PUT the file bytes here directly, not through this API' })
  uploadUrl!: string;
}
